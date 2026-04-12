import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { TQuizletSessionWord } from "models/TQuizlet";

import { getWordChar, hasValidKanaHint } from "./quizletUtils";

import "./MatchingExercise.css";

interface Props {
    words: TQuizletSessionWord[];
    showHints: boolean;
    onAttempt: (leftWordId: number, rightWordId: number) => Promise<boolean>;
}

const MAX_BATCH_SIZE = 12;
const DESKTOP_MAX_FONT_SIZE = 21;
const DESKTOP_MIN_FONT_SIZE = 12;
const MOBILE_MAX_FONT_SIZE = 18;
const MOBILE_MIN_FONT_SIZE = 11;
const FONT_SIZE_STEP = 1;
const MAX_TEXT_LINES = 3;
const LONG_TEXT_CHAR_COUNT = 14;
const VERY_LONG_TEXT_CHAR_COUNT = 22;
const LONG_TEXT_FONT_REDUCTION = 2;
const VERY_LONG_TEXT_FONT_REDUCTION = 4;
const CYRILLIC_TEXT_RE = /[\u0400-\u04FF]/;

const deterministicSortByIdHash = (left: TQuizletSessionWord, right: TQuizletSessionWord) => {
    const leftHash = ((left.id * 1103515245 + 12345) >>> 0) % 2147483647;
    const rightHash = ((right.id * 1103515245 + 12345) >>> 0) % 2147483647;

    if (leftHash === rightHash) {
        return left.id - right.id;
    }

    return leftHash - rightHash;
};

interface MatchingCardButtonProps {
    className: string;
    onClick: () => void;
    disabled: boolean;
    mainText: string;
    secondaryText?: string;
}

const getFontBounds = () => {
    if (window.matchMedia("(max-width: 768px)").matches) {
        return { max: MOBILE_MAX_FONT_SIZE, min: MOBILE_MIN_FONT_SIZE };
    }

    return { max: DESKTOP_MAX_FONT_SIZE, min: DESKTOP_MIN_FONT_SIZE };
};

const getLengthAdjustedMaxFontSize = (text: string, maxFontSize: number, minFontSize: number) => {
    const normalizedLength = text.replace(/\s+/g, "").length;

    if (normalizedLength >= VERY_LONG_TEXT_CHAR_COUNT) {
        return Math.max(minFontSize, maxFontSize - VERY_LONG_TEXT_FONT_REDUCTION);
    }

    if (normalizedLength >= LONG_TEXT_CHAR_COUNT) {
        return Math.max(minFontSize, maxFontSize - LONG_TEXT_FONT_REDUCTION);
    }

    return maxFontSize;
};

const MatchingCardButton = ({ className, onClick, disabled, mainText, secondaryText }: MatchingCardButtonProps) => {
    const cardRef = useRef<HTMLButtonElement | null>(null);
    const [fontSizePx, setFontSizePx] = useState<number>(DESKTOP_MAX_FONT_SIZE);
    const combinedText = secondaryText ? `${mainText} ${secondaryText}` : mainText;
    const isRussianText = CYRILLIC_TEXT_RE.test(combinedText);

    useLayoutEffect(() => {
        const card = cardRef.current;
        if (!card) {
            return;
        }

        let resizeObserver: ResizeObserver | null = null;
        let frameId: number | null = null;

        const fitText = () => {
            const element = cardRef.current;
            if (!element) {
                return;
            }

            const textElement = element.querySelector<HTMLElement>(".matching-card-text");
            const measuredTextElement = textElement ?? element;

            const fontBounds = getFontBounds();
            let nextFontSize = getLengthAdjustedMaxFontSize(combinedText, fontBounds.max, fontBounds.min);
            element.style.fontSize = `${nextFontSize}px`;

            const getLineHeight = () => {
                const computed = window.getComputedStyle(measuredTextElement);
                const parsedLineHeight = Number.parseFloat(computed.lineHeight);
                return Number.isFinite(parsedLineHeight) ? parsedLineHeight : nextFontSize * 1.3;
            };

            const hasTextOverflow = () => {
                const lineHeight = getLineHeight();
                const exceedsMaxLines = measuredTextElement.scrollHeight > lineHeight * MAX_TEXT_LINES + 1;
                const overflowsWidth = measuredTextElement.scrollWidth > measuredTextElement.clientWidth + 1;
                const overflowsHeight = element.scrollHeight > element.clientHeight + 1;

                return exceedsMaxLines || overflowsWidth || overflowsHeight;
            };

            while (nextFontSize > fontBounds.min) {
                const overflowDetected = hasTextOverflow();

                if (!overflowDetected) {
                    break;
                }

                nextFontSize -= FONT_SIZE_STEP;
                element.style.fontSize = `${nextFontSize}px`;
            }

            // Russian words can use wider glyphs, so enforce the same overflow fitting pass explicitly.
            while (isRussianText && nextFontSize > fontBounds.min && hasTextOverflow()) {
                nextFontSize -= FONT_SIZE_STEP;
                element.style.fontSize = `${nextFontSize}px`;
            }

            setFontSizePx(nextFontSize);
        };

        const scheduleFit = () => {
            if (frameId !== null) {
                window.cancelAnimationFrame(frameId);
            }
            frameId = window.requestAnimationFrame(fitText);
        };

        scheduleFit();
        resizeObserver = new ResizeObserver(() => {
            scheduleFit();
        });
        resizeObserver.observe(card);
        window.addEventListener("resize", scheduleFit);

        return () => {
            window.removeEventListener("resize", scheduleFit);
            if (resizeObserver !== null) {
                resizeObserver.disconnect();
            }
            if (frameId !== null) {
                window.cancelAnimationFrame(frameId);
            }
        };
    }, [combinedText, isRussianText]);

    return (
        <button
            ref={cardRef}
            className={className}
            onClick={onClick}
            disabled={disabled}
            style={{ fontSize: `${fontSizePx}px` }}
        >
            <span className={`matching-card-text ${secondaryText ? "matching-card-text-with-reading" : ""}`}>
                <span className="matching-card-main-text">{mainText}</span>
                {secondaryText && <span className="matching-card-reading">{secondaryText}</span>}
            </span>
        </button>
    );
};

const MatchingExercise = ({ words, showHints, onAttempt }: Props) => {
    const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
    const [selectedRight, setSelectedRight] = useState<number | null>(null);
    const [wrongPair, setWrongPair] = useState<{ leftId: number; rightId: number } | null>(null);
    const [correctPair, setCorrectPair] = useState<{ leftId: number; rightId: number } | null>(null);
    const [hiddenMatchedIds, setHiddenMatchedIds] = useState<Set<number>>(new Set<number>());
    const [batchWords, setBatchWords] = useState<TQuizletSessionWord[]>([]);
    const [isSending, setIsSending] = useState<boolean>(false);
    const wrongResetTimerRef = useRef<number | null>(null);
    const correctResetTimerRef = useRef<number | null>(null);
    const advanceBatchTimerRef = useRef<number | null>(null);

    const unresolvedWords = useMemo(() => words.filter((word) => !word.is_correct), [words]);

    const rightWords = useMemo(() => [...batchWords].sort(deterministicSortByIdHash), [batchWords]);

    useEffect(() => {
        if (batchWords.length === 0) {
            if (unresolvedWords.length > 0) {
                setBatchWords(unresolvedWords.slice(0, MAX_BATCH_SIZE));
                setHiddenMatchedIds(new Set<number>());
            }
        }
    }, [unresolvedWords, batchWords]);

    useEffect(() => {
        return () => {
            if (wrongResetTimerRef.current !== null) {
                window.clearTimeout(wrongResetTimerRef.current);
            }
            if (correctResetTimerRef.current !== null) {
                window.clearTimeout(correctResetTimerRef.current);
            }
            if (advanceBatchTimerRef.current !== null) {
                window.clearTimeout(advanceBatchTimerRef.current);
            }
        };
    }, []);

    const submitAttempt = async (leftId: number, rightId: number) => {
        if (isSending) {
            return;
        }

        setIsSending(true);
        const isCorrect = await onAttempt(leftId, rightId);
        setIsSending(false);

        if (isCorrect) {
            setWrongPair(null);
            setCorrectPair({ leftId, rightId });

            if (correctResetTimerRef.current !== null) {
                window.clearTimeout(correctResetTimerRef.current);
            }
            correctResetTimerRef.current = window.setTimeout(() => {
                setHiddenMatchedIds((prev) => {
                    const next = new Set(prev);
                    next.add(leftId);
                    next.add(rightId);
                    return next;
                });
                setSelectedLeft(null);
                setSelectedRight(null);
                setCorrectPair(null);
            }, 320);
            return;
        }

        setWrongPair({ leftId, rightId });
        if (wrongResetTimerRef.current !== null) {
            window.clearTimeout(wrongResetTimerRef.current);
        }
        wrongResetTimerRef.current = window.setTimeout(() => {
            setWrongPair(null);
            setSelectedLeft(null);
            setSelectedRight(null);
        }, 320);
    };

    const onSelectLeft = (wordId: number) => {
        if (isSending || wrongPair !== null || correctPair !== null || hiddenMatchedIds.has(wordId)) {
            return;
        }
        setSelectedLeft(wordId);
        if (selectedRight !== null) {
            submitAttempt(wordId, selectedRight);
        }
    };

    const onSelectRight = (wordId: number) => {
        if (isSending || wrongPair !== null || correctPair !== null || hiddenMatchedIds.has(wordId)) {
            return;
        }
        setSelectedRight(wordId);
        if (selectedLeft !== null) {
            submitAttempt(selectedLeft, wordId);
        }
    };

    useEffect(() => {
        if (batchWords.length === 0) {
            return;
        }

        const visibleInBatch = batchWords.filter((word) => !hiddenMatchedIds.has(word.id));
        if (visibleInBatch.length > 0) {
            return;
        }

        if (advanceBatchTimerRef.current !== null) {
            window.clearTimeout(advanceBatchTimerRef.current);
        }

        advanceBatchTimerRef.current = window.setTimeout(() => {
            const unresolvedById = new Set(unresolvedWords.map((word) => word.id));
            const nextBatch = unresolvedWords.filter((word) => unresolvedById.has(word.id)).slice(0, MAX_BATCH_SIZE);

            setBatchWords(nextBatch);
            setHiddenMatchedIds(new Set<number>());
            setSelectedLeft(null);
            setSelectedRight(null);
            setWrongPair(null);
            setCorrectPair(null);
        }, 120);
    }, [batchWords, hiddenMatchedIds, unresolvedWords]);

    return (
        <div className="matching-exercise">
            <div className="matching-columns">
                <div className="matching-column matching-zone-scroll">
                    <div className="matching-column-grid">
                        {batchWords.map((word) => {
                            const isHidden = hiddenMatchedIds.has(word.id);
                            const selected = selectedLeft === word.id;
                            const isWrong = wrongPair !== null && wrongPair.leftId === word.id;
                            const isCorrect = correctPair !== null && correctPair.leftId === word.id;
                            const char = getWordChar(word);
                            const shouldShowKanaHint = showHints && hasValidKanaHint(word);
                            const kanaHint = word.word_jp.trim();

                            if (isHidden) {
                                return (
                                    <div key={`left-empty-${word.id}`} className="matching-card matching-card-empty" />
                                );
                            }

                            return (
                                <MatchingCardButton
                                    key={`left-${word.id}`}
                                    className={`matching-card ${selected ? "is-selected" : ""} ${
                                        isWrong ? "is-wrong" : ""
                                    } ${isCorrect ? "is-correct" : ""}`}
                                    onClick={() => onSelectLeft(word.id)}
                                    disabled={isSending}
                                    mainText={char}
                                    secondaryText={shouldShowKanaHint ? kanaHint : undefined}
                                />
                            );
                        })}
                    </div>
                </div>

                <div className="matching-column matching-zone-scroll">
                    <div className="matching-column-grid">
                        {rightWords.map((word) => {
                            const isHidden = hiddenMatchedIds.has(word.id);
                            const selected = selectedRight === word.id;
                            const isWrong = wrongPair !== null && wrongPair.rightId === word.id;
                            const isCorrect = correctPair !== null && correctPair.rightId === word.id;

                            if (isHidden) {
                                return (
                                    <div key={`right-empty-${word.id}`} className="matching-card matching-card-empty" />
                                );
                            }

                            return (
                                <MatchingCardButton
                                    key={`right-${word.id}`}
                                    className={`matching-card ${selected ? "is-selected" : ""} ${
                                        isWrong ? "is-wrong" : ""
                                    } ${isCorrect ? "is-correct" : ""}`}
                                    onClick={() => onSelectRight(word.id)}
                                    disabled={isSending}
                                    mainText={word.ru}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {batchWords.length === 0 && (
                <div className="alert alert-success mt-3">Все пары на текущих страницах решены</div>
            )}
        </div>
    );
};

export default MatchingExercise;
