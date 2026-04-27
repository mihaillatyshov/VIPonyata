import { useEffect, useMemo, useState } from "react";

import { TQuizletSessionWord } from "models/TQuizlet";

import { getWordChar, hasValidKanaHint } from "./quizletUtils";
import TrainingSessionHeader from "./TrainingSessionHeader";

import "./FlashcardExercise.css";

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

    if (currentWord === null) {
        return null;
    }

    const charDisplay = getWordChar(currentWord);
    const shouldShowKanaHint = showHints && hasValidKanaHint(currentWord);
    const kanaHint = currentWord.word_jp.trim();
    const currentPosition = unresolvedCount > 0 ? totalWords - unresolvedCount + 1 : totalWords;
    const revealedText = direction === "jp_to_ru" ? currentWord.ru : charDisplay;
    const shouldShowSpeechButton = direction === "jp_to_ru" || isFlipped;

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
            <div className="flashcard-card-shell">
                <TrainingSessionHeader
                    incorrectAnswers={incorrectAnswers}
                    elapsedSeconds={elapsedSeconds}
                    currentPosition={currentPosition}
                    totalWords={totalWords}
                    onFinishTraining={onFinishTraining}
                />

                {shouldShowSpeechButton && (
                    <div className="flashcard-speech-actions" aria-label="Озвучка карточки">
                        <button
                            type="button"
                            className="flashcard-speech-btn"
                            onClick={() => speak(getSpeechText(currentWord), "ja-JP")}
                        >
                            🔊 JP
                        </button>
                    </div>
                )}

                <button
                    type="button"
                    className={`flashcard-card ${isFlipped ? "is-flipped" : ""} ${
                        disableFlipAnimation ? "is-instant" : ""
                    }`}
                    onClick={() => {
                        if (isSending) {
                            return;
                        }
                        setIsFlipped(!isFlipped);
                    }}
                >
                    <div className="flashcard-flip-inner">
                        <div className="flashcard-face flashcard-face-front">{renderFaceContent(false)}</div>
                        <div className="flashcard-face flashcard-face-back">{renderFaceContent(true)}</div>
                    </div>
                </button>
            </div>

            <div className={`flashcard-actions ${isFlipped ? "is-visible" : ""}`}>
                <button className="btn btn-success" disabled={isSending || !isFlipped} onClick={() => submit(true)}>
                    Помню
                </button>
                <div className="flashcard-remaining">Еще: {unresolvedCount}</div>
                <button className="btn btn-danger" disabled={isSending || !isFlipped} onClick={() => submit(false)}>
                    Не помню
                </button>
            </div>
        </div>
    );
};

export default FlashcardExercise;
