import { useEffect, useEffectEvent, useState } from "react";

import TrainingSessionHeader from "components/Quizlet/TrainingSessionHeader";
import { TReviewWord } from "models/TReview";

import {
    FlashcardDetailKey,
    getTrainingIncorrectAnswers,
    ReviewTrainingResult,
    speak,
    TrainingSession,
} from "./reviewTraining";

const DETAIL_LABELS: Record<FlashcardDetailKey, string> = {
    source: "Источник",
    note: "Примечание",
    examples: "Примеры",
};

/** Секунды с начала тренировки, обновляются раз в секунду. */
const useElapsedSeconds = (startedAt: number) => {
    const [elapsedSeconds, setElapsedSeconds] = useState(() => Math.floor((Date.now() - startedAt) / 1000));

    useEffect(() => {
        const update = () => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
        update();
        const intervalId = window.setInterval(update, 1000);
        return () => window.clearInterval(intervalId);
    }, [startedAt]);

    return elapsedSeconds;
};

interface FlashcardExtraZoneProps {
    word: TReviewWord;
    cardLanguage: "jp" | "ru";
    openedDetailKeys: FlashcardDetailKey[];
    onToggleDetail: (detailKey: FlashcardDetailKey) => void;
}

/** Кнопки и раскрывающиеся блоки «Источник»/«Примеры» (японская сторона) и «Примечание» (русская). */
const FlashcardExtraZone = ({ word, cardLanguage, openedDetailKeys, onToggleDetail }: FlashcardExtraZoneProps) => {
    const detailKeys: FlashcardDetailKey[] =
        cardLanguage === "jp"
            ? (["source", "examples"] as const).filter((key) => Boolean(word[key]))
            : word.note
              ? ["note"]
              : [];

    if (detailKeys.length === 0) {
        return null;
    }

    return (
        <div className="review-flashcard-extra-zone">
            <div className="review-flashcard-extra-toggle">
                {detailKeys.map((detailKey) => (
                    <button
                        key={detailKey}
                        type="button"
                        className={`btn btn-sm ${openedDetailKeys.includes(detailKey) ? "btn-success" : "btn-outline-success"}`}
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggleDetail(detailKey);
                        }}
                    >
                        {DETAIL_LABELS[detailKey]}
                    </button>
                ))}
            </div>

            <div className="review-flashcard-extra-list">
                {detailKeys
                    .filter((detailKey) => openedDetailKeys.includes(detailKey))
                    .map((detailKey) => (
                        <div key={detailKey} className="review-flashcard-extra-item">
                            <div className="small text-muted mb-1">{DETAIL_LABELS[detailKey]}</div>
                            <div style={detailKey === "examples" ? { whiteSpace: "pre-wrap" } : undefined}>
                                {word[detailKey]}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};

interface ReviewFlashcardSessionProps {
    session: TrainingSession;
    word: TReviewWord;
    speakJpAfterFlip: boolean;
    autoSpeakCards: boolean;
    isUpdatingFrozen: boolean;
    onReveal: () => void;
    onAnswer: (grade: ReviewTrainingResult) => void;
    onFinish: () => void;
    onToggleFrozen: () => void;
}

/** Одна карточка тренировки. Для следующей карточки компонент перемонтируется (`key`), сбрасывая переворот. */
const ReviewFlashcardSession = ({
    session,
    word,
    speakJpAfterFlip,
    autoSpeakCards,
    isUpdatingFrozen,
    onReveal,
    onAnswer,
    onFinish,
    onToggleFrozen,
}: ReviewFlashcardSessionProps) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [openedDetailKeys, setOpenedDetailKeys] = useState<FlashcardDetailKey[]>([]);
    const elapsedSeconds = useElapsedSeconds(session.startedAt);

    const isJpToRu = session.direction === "jp_to_ru";
    const frontLanguage = isJpToRu ? "jp" : "ru";
    const backLanguage = isJpToRu ? "ru" : "jp";
    const visibleLanguage = isFlipped ? backLanguage : frontLanguage;
    const speechText = visibleLanguage === "jp" ? word.word_jp : word.ru;
    const speechLang = visibleLanguage === "jp" ? "ja-JP" : "ru-RU";
    // В режиме ru → jp русскую сторону не озвучиваем.
    const showSpeechButton = !(session.direction === "ru_to_jp" && visibleLanguage === "ru");

    const toggleFlip = () => {
        if (!isFlipped) {
            onReveal();
        }
        setIsFlipped((prev) => !prev);
    };

    const toggleDetail = (detailKey: FlashcardDetailKey) => {
        setOpenedDetailKeys((prev) =>
            prev.includes(detailKey) ? prev.filter((item) => item !== detailKey) : [...prev, detailKey],
        );
    };

    useEffect(() => {
        if (autoSpeakCards) {
            speak(speechText, speechLang);
            return;
        }

        if (speakJpAfterFlip && isFlipped && visibleLanguage === "jp") {
            speak(speechText, speechLang);
        }
    }, [autoSpeakCards, speakJpAfterFlip, isFlipped, visibleLanguage, speechText, speechLang]);

    // Пробел переворачивает карточку (если фокус не в поле ввода/на кнопке).
    const handleSpaceKey = useEffectEvent((event: KeyboardEvent) => {
        if (event.key !== " " || event.repeat || event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        const target = event.target;
        if (
            target instanceof HTMLElement &&
            (target.isContentEditable ||
                target.closest("input, textarea, select, button, a, [role='button'], [contenteditable='true']") !==
                    null)
        ) {
            return;
        }

        event.preventDefault();
        toggleFlip();
    });

    useEffect(() => {
        window.addEventListener("keydown", handleSpaceKey);
        return () => window.removeEventListener("keydown", handleSpaceKey);
    }, []);

    const renderFace = (language: "jp" | "ru", isFront: boolean) => (
        <div className={`flashcard-face ${isFront ? "flashcard-face-front" : "flashcard-face-back"}`}>
            <div className="flashcard-content review-flashcard-back-content">
                <div className="review-flashcard-answer">
                    <div className={`flashcard-main-word ${language === "ru" ? "flashcard-main-word-ru" : ""}`}>
                        {language === "jp" ? word.word_jp : word.ru}
                    </div>
                </div>
                <FlashcardExtraZone
                    word={word}
                    cardLanguage={language}
                    openedDetailKeys={openedDetailKeys}
                    onToggleDetail={toggleDetail}
                />
            </div>
        </div>
    );

    return (
        <div className="flashcard-exercise review-flashcard-exercise">
            <div className="flashcard-card-shell review-flashcard-shell">
                <TrainingSessionHeader
                    incorrectAnswers={getTrainingIncorrectAnswers(session)}
                    elapsedSeconds={elapsedSeconds}
                    currentPosition={Math.max(1, session.initialWordIds.length - session.queue.length + 1)}
                    totalWords={session.initialWordIds.length}
                    onFinishTraining={onFinish}
                />

                <div className="flashcard-speech-actions review-flashcard-speech-actions" aria-label="Озвучка карточки">
                    {showSpeechButton ? (
                        <button
                            type="button"
                            className="flashcard-speech-btn"
                            onClick={() => speak(speechText, speechLang)}
                        >
                            {`🔊 ${visibleLanguage === "jp" ? "JP" : "RU"}`}
                        </button>
                    ) : null}
                </div>

                <div className="review-flashcard-memory-actions" aria-label="Управление заморозкой слова">
                    <button
                        type="button"
                        className={`review-freeze-word-btn ${word.is_frozen ? "is-active" : ""}`}
                        onClick={onToggleFrozen}
                        disabled={isUpdatingFrozen}
                        title={word.is_frozen ? "Снять заморозку" : "Заморозить слово"}
                    >
                        ❄️
                    </button>
                </div>

                <button
                    type="button"
                    className={`flashcard-card ${isFlipped ? "is-flipped" : ""}`}
                    onClick={toggleFlip}
                >
                    <div className="flashcard-flip-inner">
                        {renderFace(frontLanguage, true)}
                        {renderFace(backLanguage, false)}
                    </div>
                </button>
            </div>

            <div className={`flashcard-actions review-flashcard-actions ${isFlipped ? "is-visible" : ""}`}>
                <button type="button" className="btn btn-danger btn-lg" onClick={() => onAnswer("forgot")}>
                    не помню
                </button>
                <button type="button" className="btn btn-warning btn-lg" onClick={() => onAnswer("partial")}>
                    частично
                </button>
                <button type="button" className="btn btn-success btn-lg" onClick={() => onAnswer("remember")}>
                    помню
                </button>
            </div>
        </div>
    );
};

export default ReviewFlashcardSession;
