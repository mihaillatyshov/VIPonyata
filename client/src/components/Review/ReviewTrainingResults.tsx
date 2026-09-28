import { getTrainingResultSummary, TrainingSession } from "./reviewTraining";

interface ReviewTrainingResultsProps {
    session: TrainingSession;
    memoryStateError: string | null;
    onRepeatForgotten: () => void;
    onRepeatAll: () => void;
    onReset: () => void;
}

const ReviewTrainingResults = ({
    session,
    memoryStateError,
    onRepeatForgotten,
    onRepeatAll,
    onReset,
}: ReviewTrainingResultsProps) => {
    const summary = getTrainingResultSummary(session);
    const performanceEmoji =
        summary.forgot === 0 && summary.partial === 0 ? "😍" : summary.forgot > summary.easy ? "🙃" : "😊";

    const stats = [
        { key: "correct", icon: "bi-check-circle-fill", label: "Помню сразу", value: summary.easy },
        { key: "partial", icon: "bi-exclamation-triangle-fill", label: "Частично", value: summary.partial },
        { key: "incorrect", icon: "bi-x-circle-fill", label: "Забыла", value: summary.forgot, withEmoji: true },
        { key: "not-reviewed", icon: "bi-dash-circle-fill", label: "Не повторено", value: summary.notReviewed },
    ];

    return (
        <div className="quizlet-main-container quizlet-results" style={{ marginTop: "28px" }}>
            <h2 className="quizlet-results-title">
                Результаты <span aria-hidden>🎉</span>
            </h2>

            <div className="quizlet-results-stats">
                {stats.map((stat) => (
                    <div key={stat.key} className={`quizlet-results-stat quizlet-results-stat-${stat.key}`}>
                        <span className="quizlet-results-icon" aria-hidden>
                            <i className={`bi ${stat.icon}`} />
                        </span>
                        <span className="quizlet-results-label">{stat.label}</span>
                        <span className="quizlet-results-value">
                            {stat.value}
                            {stat.withEmoji && (
                                <span className="quizlet-results-perf-emoji" aria-hidden>
                                    {performanceEmoji}
                                </span>
                            )}
                        </span>
                    </div>
                ))}
            </div>

            <div className="quizlet-results-time-row">
                <div className="quizlet-results-time" title="Время">
                    <span className="quizlet-results-time-value">
                        {Math.floor(session.elapsedSeconds / 60)}:{`${session.elapsedSeconds % 60}`.padStart(2, "0")}
                    </span>
                    <i className="bi bi-clock quizlet-results-time-icon" aria-hidden />
                </div>
            </div>

            <div className="quizlet-results-actions">
                <button
                    type="button"
                    className="btn btn-warning quizlet-results-action-btn quizlet-btn-orange"
                    disabled={summary.forgottenIdsCount === 0}
                    onClick={onRepeatForgotten}
                >
                    <i className="bi bi-exclamation-triangle" aria-hidden />
                    Повторить забытое
                </button>
                <button type="button" className="btn btn-success quizlet-results-action-btn" onClick={onRepeatAll}>
                    <i className="bi bi-arrow-repeat" aria-hidden />
                    Повторить всё
                </button>
                <button type="button" className="btn btn-secondary quizlet-results-action-btn" onClick={onReset}>
                    <i className="bi bi-box-arrow-right" aria-hidden />К выбору топиков
                </button>
            </div>

            {memoryStateError && <div className="alert alert-warning mt-3 mb-0">{memoryStateError}</div>}
        </div>
    );
};

export default ReviewTrainingResults;
