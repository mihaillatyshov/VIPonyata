import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { TQuizletWritingAnswerResult } from "api/quizlet";
import { TQuizletSessionWord } from "models/TQuizlet";

import TrainingSessionHeader from "./TrainingSessionHeader";

import "./FlashcardExercise.css";
import "./WritingExercise.css";

const KANJI_RE = /[㐀-䶿一-鿿豈-﫿々]/;
const LATIN_RE = /[a-zA-Zа-яА-ЯёЁ]/;

type WritingFeedback = TQuizletWritingAnswerResult & {
    word: TQuizletSessionWord;
    answer: string;
    isLastWord: boolean;
};

/** Подсказка, почему ответ не отправлен (не засчитывается как ошибка). */
const getInputWarning = (answer: string): string | null => {
    if (KANJI_RE.test(answer)) {
        return "Пиши хираганой — без иероглифов";
    }
    if (LATIN_RE.test(answer)) {
        return "Включи японскую раскладку и напиши слово хираганой";
    }
    return null;
};

interface Props {
    words: TQuizletSessionWord[];
    queue: number[];
    totalWords: number;
    unresolvedCount: number;
    incorrectAnswers: number;
    elapsedSeconds: number;
    onFinishTraining: () => void;
    onAnswer: (
        wordId: number,
        answer: string,
    ) => Promise<(TQuizletWritingAnswerResult & { isLastWord: boolean }) | null>;
    onComplete: () => void;
}

const WritingExercise = ({
    words,
    queue,
    totalWords,
    unresolvedCount,
    incorrectAnswers,
    elapsedSeconds,
    onFinishTraining,
    onAnswer,
    onComplete,
}: Props) => {
    const [answer, setAnswer] = useState("");
    const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
    const [warning, setWarning] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    // Слово, на которое только что ответили: пока сессия перезапрашивается, оно ещё может стоять первым в очереди.
    const [lastAnsweredId, setLastAnsweredId] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const queueWordId = queue.find((wordId) => wordId !== lastAnsweredId) ?? queue[0];
    const queueWord =
        (queueWordId !== undefined ? words.find((word) => word.id === queueWordId) : undefined) ??
        words.find((word) => !word.is_correct && word.id !== lastAnsweredId) ??
        null;
    const currentWord = feedback?.word ?? queueWord;

    useEffect(() => {
        inputRef.current?.focus();
    }, [currentWord?.id, feedback]);

    // Все слова отвечены, а сессия не завершена (например, вкладку закрыли на последнем ответе).
    useEffect(() => {
        if (currentWord === null) {
            onComplete();
        }
    }, [currentWord, onComplete]);

    if (currentWord === null) {
        return null;
    }

    const submit = async () => {
        const trimmedAnswer = answer.trim();
        if (isSending || trimmedAnswer === "") {
            return;
        }

        const inputWarning = getInputWarning(trimmedAnswer);
        setWarning(inputWarning);
        if (inputWarning !== null) {
            return;
        }

        setIsSending(true);
        try {
            const result = await onAnswer(currentWord.id, trimmedAnswer);
            if (result !== null) {
                setLastAnsweredId(currentWord.id);
                setFeedback({ ...result, word: currentWord, answer: trimmedAnswer });
            }
        } catch {
            setWarning("Не удалось отправить ответ, попробуй ещё раз");
        } finally {
            setIsSending(false);
        }
    };

    const next = () => {
        if (feedback === null) {
            return;
        }

        if (feedback.isLastWord) {
            onComplete();
            return;
        }

        setFeedback(null);
        setAnswer("");
        setWarning(null);
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        if (feedback === null) {
            void submit();
        } else {
            next();
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        // Enter, подтверждающий ввод в японской раскладке (IME), не должен отправлять ответ.
        if (event.key === "Enter" && (event.nativeEvent.isComposing || event.keyCode === 229)) {
            event.preventDefault();
        }
    };

    const currentPosition = unresolvedCount > 0 ? totalWords - unresolvedCount + 1 : totalWords;
    const stateClass = feedback === null ? "" : feedback.is_correct ? "is-correct" : "is-incorrect";
    const kanji = feedback?.char_jp?.trim();
    const shouldShowKanji = kanji !== undefined && kanji !== "" && kanji !== feedback?.word_jp.trim();

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

                <div key={currentWord.id} className={`writing-card ${stateClass}`}>
                    <div className="writing-card-content">
                        <div className="writing-card-ru">{currentWord.ru}</div>

                        {feedback === null ? (
                            <div className="writing-card-instruction">Напиши по-японски хираганой</div>
                        ) : (
                            <div className="writing-card-answer">
                                <div className="writing-card-verdict">
                                    {feedback.is_correct ? (
                                        <>
                                            <i className="bi bi-check-circle-fill" /> Верно!
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-x-circle-fill" /> Неверно
                                        </>
                                    )}
                                </div>
                                <div className="writing-card-kana">{feedback.word_jp}</div>
                                {shouldShowKanji && <div className="writing-card-kanji">{kanji}</div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <form className="writing-form" onSubmit={handleSubmit}>
                <input
                    ref={inputRef}
                    className={`form-control writing-input ${stateClass}`}
                    value={feedback === null ? answer : feedback.answer}
                    onChange={(event) => {
                        setAnswer(event.target.value);
                        setWarning(null);
                    }}
                    onKeyDown={handleKeyDown}
                    readOnly={feedback !== null || isSending}
                    placeholder="ひらがなで…"
                    lang="ja"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    enterKeyHint={feedback === null ? "done" : "next"}
                    aria-label="Ответ хираганой"
                />
                <button
                    type="submit"
                    className={`btn ${feedback === null ? "btn-primary" : "btn-outline-primary"} writing-submit-btn`}
                    disabled={isSending || (feedback === null && answer.trim() === "")}
                >
                    {feedback === null ? "Проверить" : "Дальше"}
                </button>
            </form>

            <div className="writing-footer">
                {warning !== null ? (
                    <span className="text-danger">{warning}</span>
                ) : (
                    <span className="text-muted">
                        {feedback === null ? "Enter — проверить" : "Enter — дальше"} • Еще: {unresolvedCount}
                    </span>
                )}
            </div>
        </div>
    );
};

export default WritingExercise;
