import { useMemo, useState } from "react";

import { TQuizletSessionWord } from "models/TQuizlet";

import { getWordChar, hasValidKanaHint } from "./quizletUtils";

interface Props {
    words: TQuizletSessionWord[];
    queue: number[];
    showHints: boolean;
    direction: "jp_to_ru" | "ru_to_jp";
    onAnswer: (wordId: number, recognized: boolean) => Promise<void>;
}

const FlashcardExercise = ({ words, queue, showHints, direction, onAnswer }: Props) => {
    const [isFlipped, setIsFlipped] = useState<boolean>(false);
    const [isSending, setIsSending] = useState<boolean>(false);

    const currentWord = useMemo(() => {
        const queueWord = queue.length > 0 ? words.find((word) => word.id === queue[0]) : undefined;
        return queueWord ?? words.find((word) => !word.is_correct) ?? null;
    }, [words, queue]);

    const submit = async (recognized: boolean) => {
        if (isSending || currentWord === null) {
            return;
        }
        setIsSending(true);
        await onAnswer(currentWord.id, recognized);
        setIsSending(false);
        setIsFlipped(false);
    };

    if (currentWord === null) {
        return <div className="alert alert-success">Карточки завершены</div>;
    }

    const charDisplay = getWordChar(currentWord);
    const shouldShowKanaHint = showHints && hasValidKanaHint(currentWord);
    const kanaHint = currentWord.word_jp.trim();

    return (
        <div>
            <h4 className="mb-3">Flashcards</h4>
            <button
                className="card w-100 text-start p-4 mb-3"
                style={{ minHeight: 220 }}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                {!isFlipped && direction === "jp_to_ru" && (
                    <div>
                        <div className="fs-2 mb-2">{charDisplay}</div>
                        {shouldShowKanaHint && <div className="text-muted">({kanaHint})</div>}
                    </div>
                )}

                {!isFlipped && direction === "ru_to_jp" && <div className="fs-3">{currentWord.ru}</div>}

                {isFlipped && (
                    <div>
                        <div className="text-muted">char_jp</div>
                        <div className="fs-2 mb-2">{charDisplay}</div>

                        <div className="text-muted">word_jp</div>
                        <div className="fs-4 mb-2">{currentWord.word_jp}</div>

                        <div className="text-muted">ru</div>
                        <div className="fs-4">{currentWord.ru}</div>
                    </div>
                )}
            </button>

            <div className="d-flex gap-2">
                <button className="btn btn-success" disabled={!isFlipped || isSending} onClick={() => submit(true)}>
                    Узнал
                </button>
                <button className="btn btn-danger" disabled={!isFlipped || isSending} onClick={() => submit(false)}>
                    Не узнал
                </button>
            </div>
        </div>
    );
};

export default FlashcardExercise;
