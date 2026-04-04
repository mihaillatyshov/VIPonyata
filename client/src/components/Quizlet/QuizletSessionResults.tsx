import "./QuizletSessionResults.css";
import "./QuizletShared.css";

interface Props {
    correct: number;
    incorrect: number;
    skipped: number;
    totalWords: number;
    elapsedSeconds: number;
    onRetryAll: () => void;
    onRetryIncorrect: () => void;
    onFinish: () => void;
}

const QuizletSessionResults = ({
    correct,
    incorrect,
    skipped,
    totalWords,
    elapsedSeconds,
    onRetryAll,
    onRetryIncorrect,
    onFinish,
}: Props) => {
    const performanceEmoji = incorrect === 0 ? "😍" : incorrect > correct ? "🙃" : "😊";
    const viewedCards = correct + incorrect;
    const shouldShowSkipped = skipped > 0 && viewedCards < totalWords;
    const shouldShowRetryIncorrect = incorrect > 0 || skipped > 0;

    return (
        <div className="quizlet-main-container quizlet-results">
            <h2 className="quizlet-results-title">
                Результаты <span aria-hidden>🎉</span>
            </h2>

            <div className="quizlet-results-stats">
                <div className="quizlet-results-stat quizlet-results-stat-correct">
                    <span className="quizlet-results-icon" aria-hidden>
                        <i className="bi bi-check-circle-fill" />
                    </span>
                    <span className="quizlet-results-label">Повторено</span>
                    <span className="quizlet-results-value">{correct}</span>
                </div>

                <div className="quizlet-results-stat quizlet-results-stat-incorrect">
                    <span className="quizlet-results-icon" aria-hidden>
                        <i className="bi bi-x-circle-fill" />
                    </span>
                    <span className="quizlet-results-label">Ошибки</span>
                    <span className="quizlet-results-value">
                        {incorrect}
                        <span className="quizlet-results-perf-emoji" aria-hidden>
                            {performanceEmoji}
                        </span>
                    </span>
                </div>

                {shouldShowSkipped && (
                    <div className="quizlet-results-stat quizlet-results-stat-skipped">
                        <span className="quizlet-results-icon" aria-hidden>
                            <i className="bi bi-dash-circle-fill" />
                        </span>
                        <span className="quizlet-results-label">Не выполнено</span>
                        <span className="quizlet-results-value">{skipped}</span>
                    </div>
                )}
            </div>

            <div className="quizlet-results-time-row">
                <div className="quizlet-results-time" title="Время">
                    <span className="quizlet-results-time-value">
                        {Math.floor(elapsedSeconds / 60)}:{`${elapsedSeconds % 60}`.padStart(2, "0")}
                    </span>
                    <i className="bi bi-clock quizlet-results-time-icon" aria-hidden />
                </div>
            </div>

            <div
                className={`quizlet-results-actions ${!shouldShowRetryIncorrect ? "quizlet-results-actions-two" : ""}`}
            >
                <button className="btn btn-success quizlet-results-action-btn" onClick={onRetryAll}>
                    <i className="bi bi-arrow-repeat" aria-hidden />
                    Повторить все
                </button>
                {shouldShowRetryIncorrect && (
                    <button
                        className="btn btn-warning quizlet-results-action-btn quizlet-btn-orange"
                        onClick={onRetryIncorrect}
                    >
                        <i className="bi bi-exclamation-triangle" aria-hidden />
                        Повторить ошибки
                    </button>
                )}
                <button className="btn btn-secondary quizlet-results-action-btn" onClick={onFinish}>
                    <i className="bi bi-box-arrow-right" aria-hidden />
                    Выйти
                </button>
            </div>
        </div>
    );
};

export default QuizletSessionResults;
