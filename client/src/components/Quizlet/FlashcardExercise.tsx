import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type PointerEvent as ReactPointerEvent,
} from "react";

import { TQuizletSessionWord } from "models/TQuizlet";

import { getWordChar, hasValidKanaHint } from "./quizletUtils";
import TrainingSessionHeader from "./TrainingSessionHeader";

import "./FlashcardExercise.css";

const SWIPE_THRESHOLD_PX = 100;
const SWIPE_MAX_OFFSET_PX = 180;
const SWIPE_EXIT_OFFSET_PX = 720;
const SWIPE_MAX_ROTATION_DEG = 10;
const SWIPE_AXIS_LOCK_PX = 14;
const SWIPE_ACTIVATION_PX = 8;
const SWIPE_EXIT_DELAY_MS = 180;
const SWIPE_RETURN_DURATION_MS = 320;
const CARD_ENTRY_DURATION_MS = 260;

type PointerSwipeState = {
    pointerId: number;
    startX: number;
    startY: number;
    lock: "pending" | "horizontal" | "vertical";
};

const speak = (text: string, lang: "ja-JP" | "ru-RU") => {
    const normalizedText = text.trim();

    if (!normalizedText || typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(normalizedText);
    utterance.lang = lang;

    window.speechSynthesis.speak(utterance);
};

const getSpeechText = (word: Pick<TQuizletSessionWord, "char_jp" | "word_jp">) => {
    const kanji = word.char_jp?.trim();

    return kanji ? kanji : word.word_jp;
};

interface Props {
    words: TQuizletSessionWord[];
    queue: number[];
    showHints: boolean;
    direction: "jp_to_ru" | "ru_to_jp";
    autoSpeakAfterFlip: boolean;
    onAutoSpeakAfterFlipChange: (enabled: boolean) => void;
    totalWords: number;
    unresolvedCount: number;
    incorrectAnswers: number;
    elapsedSeconds: number;
    onFinishTraining: () => void;
    onWordVisible: (wordId: number) => void;
    onAnswer: (wordId: number, recognized: boolean) => Promise<void>;
}

const FlashcardExercise = ({
    words,
    queue,
    showHints,
    direction,
    autoSpeakAfterFlip,
    onAutoSpeakAfterFlipChange,
    totalWords,
    unresolvedCount,
    incorrectAnswers,
    elapsedSeconds,
    onFinishTraining,
    onWordVisible,
    onAnswer,
}: Props) => {
    const [isFlipped, setIsFlipped] = useState<boolean>(false);
    const [isSending, setIsSending] = useState<boolean>(false);
    const [disableFlipAnimation, setDisableFlipAnimation] = useState<boolean>(false);
    const [swipeOffsetX, setSwipeOffsetX] = useState<number>(0);
    const [isSwipeReturning, setIsSwipeReturning] = useState<boolean>(false);
    const [isSwipeExiting, setIsSwipeExiting] = useState<boolean>(false);
    const [isCardEntering, setIsCardEntering] = useState<boolean>(true);
    const cardRef = useRef<HTMLButtonElement | null>(null);
    const pointerSwipeStateRef = useRef<PointerSwipeState | null>(null);
    const suppressFlipClickRef = useRef<boolean>(false);
    const swipeReturnTimeoutRef = useRef<number | null>(null);
    const swipeExitTimeoutRef = useRef<number | null>(null);
    const cardEntryTimeoutRef = useRef<number | null>(null);

    const currentWord = useMemo(() => {
        const queueWord = queue.length > 0 ? words.find((word) => word.id === queue[0]) : undefined;
        return queueWord ?? words.find((word) => !word.is_correct) ?? null;
    }, [words, queue]);

    useEffect(() => {
        if (currentWord === null) {
            return;
        }

        onWordVisible(currentWord.id);
    }, [currentWord, onWordVisible]);

    useEffect(() => {
        if (!autoSpeakAfterFlip || !isFlipped || currentWord === null) {
            return;
        }

        speak(getSpeechText(currentWord), "ja-JP");
    }, [autoSpeakAfterFlip, isFlipped, currentWord]);

    useEffect(() => {
        if (swipeReturnTimeoutRef.current !== null) {
            window.clearTimeout(swipeReturnTimeoutRef.current);
            swipeReturnTimeoutRef.current = null;
        }

        if (swipeExitTimeoutRef.current !== null) {
            window.clearTimeout(swipeExitTimeoutRef.current);
            swipeExitTimeoutRef.current = null;
        }

        if (cardEntryTimeoutRef.current !== null) {
            window.clearTimeout(cardEntryTimeoutRef.current);
        }

        pointerSwipeStateRef.current = null;
        suppressFlipClickRef.current = false;
        setSwipeOffsetX(0);
        setIsSwipeReturning(false);
        setIsSwipeExiting(false);
        setIsCardEntering(true);

        cardEntryTimeoutRef.current = window.setTimeout(() => {
            setIsCardEntering(false);
            cardEntryTimeoutRef.current = null;
        }, CARD_ENTRY_DURATION_MS);
    }, [currentWord?.id]);

    useEffect(() => {
        return () => {
            if (swipeReturnTimeoutRef.current !== null) {
                window.clearTimeout(swipeReturnTimeoutRef.current);
            }

            if (swipeExitTimeoutRef.current !== null) {
                window.clearTimeout(swipeExitTimeoutRef.current);
            }

            if (cardEntryTimeoutRef.current !== null) {
                window.clearTimeout(cardEntryTimeoutRef.current);
            }
        };
    }, []);

    const submit = async (recognized: boolean) => {
        if (isSending || currentWord === null) {
            return;
        }

        // Keep transition only for manual card flips.
        // When answering, reset to the front instantly before moving to next card.
        setDisableFlipAnimation(true);
        setIsFlipped(false);
        setIsSending(true);
        await onAnswer(currentWord.id, recognized);
        setIsSending(false);

        requestAnimationFrame(() => {
            setDisableFlipAnimation(false);
        });
    };

    const scheduleSwipeReturn = () => {
        if (swipeReturnTimeoutRef.current !== null) {
            window.clearTimeout(swipeReturnTimeoutRef.current);
        }

        setIsSwipeReturning(true);
        setSwipeOffsetX(0);

        swipeReturnTimeoutRef.current = window.setTimeout(() => {
            setIsSwipeReturning(false);
            swipeReturnTimeoutRef.current = null;
        }, SWIPE_RETURN_DURATION_MS);
    };

    const completeSwipe = (recognized: boolean) => {
        if (currentWord === null || isSending || isSwipeExiting) {
            return;
        }

        if (swipeReturnTimeoutRef.current !== null) {
            window.clearTimeout(swipeReturnTimeoutRef.current);
            swipeReturnTimeoutRef.current = null;
        }

        setIsSwipeReturning(false);
        setIsSwipeExiting(true);
        setSwipeOffsetX(recognized ? SWIPE_EXIT_OFFSET_PX : -SWIPE_EXIT_OFFSET_PX);
        suppressFlipClickRef.current = true;

        swipeExitTimeoutRef.current = window.setTimeout(() => {
            swipeExitTimeoutRef.current = null;
            void submit(recognized);
        }, SWIPE_EXIT_DELAY_MS);
    };

    const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
        if (!isFlipped || isSending || isSwipeExiting) {
            return;
        }

        if (event.pointerType === "mouse" && event.button !== 0) {
            return;
        }

        pointerSwipeStateRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            lock: "pending",
        };
        suppressFlipClickRef.current = false;

        if (swipeReturnTimeoutRef.current !== null) {
            window.clearTimeout(swipeReturnTimeoutRef.current);
            swipeReturnTimeoutRef.current = null;
        }

        setIsSwipeReturning(false);
    };

    const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
        const pointerState = pointerSwipeStateRef.current;

        if (
            pointerState === null ||
            pointerState.pointerId !== event.pointerId ||
            !isFlipped ||
            isSending ||
            isSwipeExiting
        ) {
            return;
        }

        const deltaX = event.clientX - pointerState.startX;
        const deltaY = event.clientY - pointerState.startY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (pointerState.lock === "pending") {
            if (absX < SWIPE_ACTIVATION_PX && absY < SWIPE_ACTIVATION_PX) {
                return;
            }

            if (absY > absX && absY >= SWIPE_AXIS_LOCK_PX) {
                pointerSwipeStateRef.current = {
                    ...pointerState,
                    lock: "vertical",
                };
                return;
            }

            if (absX >= absY && absX >= SWIPE_AXIS_LOCK_PX) {
                pointerSwipeStateRef.current = {
                    ...pointerState,
                    lock: "horizontal",
                };
                suppressFlipClickRef.current = true;
                cardRef.current?.setPointerCapture(event.pointerId);
            } else {
                return;
            }
        }

        if (pointerSwipeStateRef.current?.lock !== "horizontal") {
            return;
        }

        event.preventDefault();

        const limitedOffset = Math.max(-SWIPE_MAX_OFFSET_PX, Math.min(SWIPE_MAX_OFFSET_PX, deltaX));
        setSwipeOffsetX(limitedOffset);
    };

    const releaseSwipePointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
        if (cardRef.current?.hasPointerCapture(event.pointerId)) {
            cardRef.current.releasePointerCapture(event.pointerId);
        }

        const pointerState = pointerSwipeStateRef.current;

        if (pointerState === null || pointerState.pointerId !== event.pointerId) {
            return;
        }

        const deltaX = event.clientX - pointerState.startX;
        const absX = Math.abs(deltaX);
        const wasHorizontalSwipe = pointerState.lock === "horizontal";

        pointerSwipeStateRef.current = null;

        if (!wasHorizontalSwipe) {
            return;
        }

        event.preventDefault();

        if (absX >= SWIPE_THRESHOLD_PX) {
            completeSwipe(deltaX > 0);
            return;
        }

        scheduleSwipeReturn();
    };

    if (currentWord === null) {
        return null;
    }

    const charDisplay = getWordChar(currentWord);
    const shouldShowKanaHint = showHints && hasValidKanaHint(currentWord);
    const kanaHint = currentWord.word_jp.trim();
    const currentPosition = unresolvedCount > 0 ? totalWords - unresolvedCount + 1 : totalWords;
    const revealedText = direction === "jp_to_ru" ? currentWord.ru : charDisplay;
    const shouldShowSpeechButton = direction === "jp_to_ru" || isFlipped;
    const swipeProgress = Math.min(Math.abs(swipeOffsetX) / SWIPE_THRESHOLD_PX, 1);
    const cardStyle = {
        "--flashcard-swipe-x": `${swipeOffsetX}px`,
        "--flashcard-swipe-rotate": `${(swipeOffsetX / SWIPE_MAX_OFFSET_PX) * SWIPE_MAX_ROTATION_DEG}deg`,
        "--flashcard-swipe-progress": `${swipeProgress}`,
        "--flashcard-swipe-right-opacity": `${swipeOffsetX > 0 ? swipeProgress : 0}`,
        "--flashcard-swipe-left-opacity": `${swipeOffsetX < 0 ? swipeProgress : 0}`,
    } as CSSProperties;

    const renderFaceContent = (showTranslation: boolean) => (
        <div className="flashcard-content">
            {direction === "jp_to_ru" && (
                <>
                    <div className="flashcard-main-word">{charDisplay}</div>
                    {hasValidKanaHint(currentWord) && (showHints || showTranslation) && (
                        <div className="flashcard-reading">{kanaHint}</div>
                    )}
                </>
            )}

            {direction === "ru_to_jp" &&
                (showTranslation ? (
                    <>
                        <div className="flashcard-main-word">{revealedText}</div>
                        {shouldShowKanaHint && <div className="flashcard-reading">{kanaHint}</div>}
                    </>
                ) : (
                    <div className="flashcard-main-word flashcard-main-word-ru">{currentWord.ru}</div>
                ))}

            <div className={`flashcard-translation ${showTranslation ? "is-visible" : ""}`}>
                {showTranslation ? (
                    <>
                        <div>{direction === "ru_to_jp" ? currentWord.ru : revealedText}</div>
                    </>
                ) : (
                    ""
                )}
            </div>
        </div>
    );

    return (
        <div className="flashcard-exercise">
            <div className={`flashcard-card-shell ${isCardEntering ? "is-card-entering" : ""}`}>
                <TrainingSessionHeader
                    incorrectAnswers={incorrectAnswers}
                    elapsedSeconds={elapsedSeconds}
                    currentPosition={currentPosition}
                    totalWords={totalWords}
                    onFinishTraining={onFinishTraining}
                />

                <div className="flashcard-speech-actions" aria-label="Настройки озвучки">
                    {shouldShowSpeechButton && (
                        <button
                            type="button"
                            className="flashcard-speech-btn"
                            onClick={() => speak(getSpeechText(currentWord), "ja-JP")}
                        >
                            🔊 JP
                        </button>
                    )}
                    <label
                        className="flashcard-auto-speak-toggle"
                        onClick={(event) => event.stopPropagation()}
                        onPointerDown={(event) => event.stopPropagation()}
                    >
                        <input
                            type="checkbox"
                            className="form-check-input m-0"
                            checked={autoSpeakAfterFlip}
                            onClick={(event) => event.stopPropagation()}
                            onPointerDown={(event) => event.stopPropagation()}
                            onChange={(event) => onAutoSpeakAfterFlipChange(event.target.checked)}
                        />
                        <span>авто</span>
                    </label>
                </div>

                <button
                    type="button"
                    className={`flashcard-card ${isFlipped ? "is-flipped" : ""} ${
                        disableFlipAnimation ? "is-instant" : ""
                    } ${swipeOffsetX !== 0 ? "is-swipe-active" : ""} ${
                        isSwipeReturning ? "is-swipe-returning" : ""
                    } ${isSwipeExiting ? "is-swipe-exiting" : ""}`}
                    ref={cardRef}
                    style={cardStyle}
                    onClick={() => {
                        if (isSending || isSwipeExiting) {
                            return;
                        }

                        if (suppressFlipClickRef.current) {
                            suppressFlipClickRef.current = false;
                            return;
                        }

                        setIsFlipped(!isFlipped);
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={releaseSwipePointer}
                    onPointerCancel={releaseSwipePointer}
                >
                    <span className="flashcard-swipe-indicator flashcard-swipe-indicator-left" aria-hidden>
                        <span className="flashcard-swipe-indicator-icon">↺</span>
                        <span className="flashcard-swipe-indicator-label">Не помню</span>
                    </span>
                    <span className="flashcard-swipe-indicator flashcard-swipe-indicator-right" aria-hidden>
                        <span className="flashcard-swipe-indicator-icon">✓</span>
                        <span className="flashcard-swipe-indicator-label">Помню</span>
                    </span>
                    <div className="flashcard-flip-inner">
                        <div className="flashcard-face flashcard-face-front">{renderFaceContent(false)}</div>
                        <div className="flashcard-face flashcard-face-back">{renderFaceContent(true)}</div>
                    </div>
                </button>
            </div>

            <div className={`flashcard-actions ${isFlipped ? "is-visible" : ""}`}>
                <button className="btn btn-danger" disabled={isSending || !isFlipped} onClick={() => submit(false)}>
                    Не помню
                </button>
                <div className="flashcard-remaining">Еще: {unresolvedCount}</div>
                <button className="btn btn-success" disabled={isSending || !isFlipped} onClick={() => submit(true)}>
                    Помню
                </button>
            </div>
        </div>
    );
};

export default FlashcardExercise;
