interface Props {
    correct: number;
    incorrect: number;
    skipped: number;
    elapsedSeconds: number;
    onRetryAll: () => void;
    onRetryIncorrect: () => void;
    onFinish: () => void;
}

const QuizletSessionResults = ({
    correct,
    incorrect,
    skipped,
    elapsedSeconds,
    onRetryAll,
    onRetryIncorrect,
    onFinish,
}: Props) => {
    return (
        <div className="card p-4">
            <h4 className="mb-3">Результат</h4>
            <div className="mb-2">Правильно: {correct}</div>
            <div className="mb-2">Ошибок: {incorrect}</div>
            <div className="mb-2">Пропущено: {skipped}</div>
            <div className="mb-4">Время: {elapsedSeconds} сек.</div>

            <div className="d-flex gap-2 flex-wrap">
                <button className="btn btn-outline-primary" onClick={onRetryAll}>
                    Повторить со всеми словами
                </button>
                <button className="btn btn-warning" onClick={onRetryIncorrect}>
                    Повторить ошибки
                </button>
                <button className="btn btn-secondary" onClick={onFinish}>
                    Завершить
                </button>
            </div>
        </div>
    );
};

export default QuizletSessionResults;
