import { useMemo, useState } from "react";

import { TQuizletSessionWord } from "models/TQuizlet";

import { getWordChar, hasValidKanaHint } from "./quizletUtils";

interface Props {
    words: TQuizletSessionWord[];
    showHints: boolean;
    onAttempt: (leftWordId: number, rightWordId: number) => Promise<boolean>;
}

const MatchingExercise = ({ words, showHints, onAttempt }: Props) => {
    const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
    const [selectedRight, setSelectedRight] = useState<number | null>(null);
    const [wrongPair, setWrongPair] = useState<{ leftId: number; rightId: number } | null>(null);
    const [isSending, setIsSending] = useState<boolean>(false);

    const unresolvedWords = useMemo(() => words.filter((word) => !word.is_correct), [words]);
    const pageWords = useMemo(() => unresolvedWords.slice(0, 12), [unresolvedWords]);

    const rightWords = useMemo(() => {
        return [...pageWords].sort(() => Math.random() - 0.5);
    }, [pageWords]);

    const submitAttempt = async (leftId: number, rightId: number) => {
        setIsSending(true);
        const isCorrect = await onAttempt(leftId, rightId);
        setIsSending(false);

        if (isCorrect) {
            setSelectedLeft(null);
            setSelectedRight(null);
            setWrongPair(null);
            return;
        }

        setWrongPair({ leftId, rightId });
        setTimeout(() => setWrongPair(null), 1000);
    };

    const onSelectLeft = (wordId: number) => {
        if (isSending) {
            return;
        }
        setSelectedLeft(wordId);
        if (selectedRight !== null) {
            submitAttempt(wordId, selectedRight);
        }
    };

    const onSelectRight = (wordId: number) => {
        if (isSending) {
            return;
        }
        setSelectedRight(wordId);
        if (selectedLeft !== null) {
            submitAttempt(selectedLeft, wordId);
        }
    };

    return (
        <div>
            <h4 className="mb-3">Pair matching</h4>
            <div className="row g-3">
                <div className="col-12 col-md-6">
                    <h6>Japanese</h6>
                    <div className="d-grid gap-2">
                        {pageWords.map((word) => {
                            const selected = selectedLeft === word.id;
                            const isWrong = wrongPair !== null && wrongPair.leftId === word.id;
                            const char = getWordChar(word);
                            const kanaHint = word.word_jp.trim();
                            const title = showHints && hasValidKanaHint(word) ? `${char} (${kanaHint})` : char;

                            return (
                                <button
                                    key={`left-${word.id}`}
                                    className={`btn text-start ${
                                        isWrong
                                            ? "btn-danger"
                                            : selected
                                            ? "btn-warning"
                                            : word.is_correct
                                            ? "btn-success"
                                            : "btn-outline-dark"
                                    }`}
                                    onClick={() => onSelectLeft(word.id)}
                                >
                                    {title}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="col-12 col-md-6">
                    <h6>Русский</h6>
                    <div className="d-grid gap-2">
                        {rightWords.map((word) => {
                            const selected = selectedRight === word.id;
                            const isWrong = wrongPair !== null && wrongPair.rightId === word.id;

                            return (
                                <button
                                    key={`right-${word.id}`}
                                    className={`btn text-start ${
                                        isWrong
                                            ? "btn-danger"
                                            : selected
                                            ? "btn-warning"
                                            : word.is_correct
                                            ? "btn-success"
                                            : "btn-outline-dark"
                                    }`}
                                    onClick={() => onSelectRight(word.id)}
                                >
                                    {word.ru}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {pageWords.length === 0 && (
                <div className="alert alert-success mt-3">Все пары на текущих страницах решены</div>
            )}
        </div>
    );
};

export default MatchingExercise;
