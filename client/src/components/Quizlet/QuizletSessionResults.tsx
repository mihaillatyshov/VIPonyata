import "./QuizletSessionResults.css";

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
        <div className="quizlet-results">
            <div className="quizlet-results-stats">
                <div className="quizlet-results-stat quizlet-results-stat-correct">
                    <span className="quizlet-results-icon" aria-hidden>
                        <i className="bi bi-check-circle-fill" />
                    </span>
                    <span className="quizlet-results-label">Помню</span>
                    <span className="quizlet-results-value">{correct}</span>
                </div>

                <div className="quizlet-results-stat quizlet-results-stat-incorrect">
                    <span className="quizlet-results-icon" aria-hidden>
                        <i className="bi bi-x-circle-fill" />
                    </span>
                    <span className="quizlet-results-label">Не помню</span>
                    <span className="quizlet-results-value">{incorrect}</span>
                </div>

                {skipped > 0 && (
                    <div className="quizlet-results-stat quizlet-results-stat-skipped">
                        <span className="quizlet-results-icon" aria-hidden>
                            <i className="bi bi-dash-circle-fill" />
                        </span>
                        <span className="quizlet-results-label">Не повторено</span>
                        <span className="quizlet-results-value">{skipped}</span>
                    </div>
                )}
            </div>

            <div className="quizlet-results-time" title="Время">
                <i className="bi bi-clock" />
                <span>
                    {Math.floor(elapsedSeconds / 60)}:{`${elapsedSeconds % 60}`.padStart(2, "0")}
                </span>
            </div>

            <div className="quizlet-results-actions">
                <button className="btn btn-outline-primary" onClick={onRetryAll}>
                    Повторить все
                </button>
                <button className="btn btn-warning" onClick={onRetryIncorrect}>
                    Повторить ошибки
                </button>
                <button className="btn btn-secondary" onClick={onFinish}>
                    Выйти
                </button>
            </div>
        </div>
    );
};

export default QuizletSessionResults;
