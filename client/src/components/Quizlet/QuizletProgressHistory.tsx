import { Fragment } from "react";

import { TQuizletSession, TQuizletSessionWord } from "models/TQuizlet";

import "./QuizletProgressHistory.css";
import "./QuizletShared.css";

interface Props {
    sessions: TQuizletSession[];
    isLoading: boolean;
    hasError: boolean;
    expandedSessionId: number | null;
    loadingDetailsSessionId: number | null;
    sessionWordsById: Record<number, TQuizletSessionWord[]>;
    onRowClick: (sessionId: number) => void;
    onRetryLoad: () => void;
    getTopicsFromSessionWords: (sessionWords: TQuizletSessionWord[]) => string[];
}

const toDateText = (value: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("ru-RU");
};

const toDurationText = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const hh = String(Math.floor(safeSeconds / 3600)).padStart(2, "0");
    const mm = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, "0");
    const ss = String(safeSeconds % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
};

const QuizletProgressHistory = ({
    sessions,
    isLoading,
    hasError,
    expandedSessionId,
    loadingDetailsSessionId,
    sessionWordsById,
    onRowClick,
    onRetryLoad,
    getTopicsFromSessionWords,
}: Props) => {
    return (
        <div className="quizlet-main-container quizlet-results quizlet-progress-history">
            <h2 className="quizlet-results-title quizlet-progress-history-title">✨ Мои успехи</h2>

            {isLoading && <div className="text-muted">Загрузка истории...</div>}

            {!isLoading && hasError && (
                <div className="alert alert-warning mb-0">
                    Не удалось загрузить историю тренировок.
                    <button type="button" className="btn btn-sm btn-outline-secondary ms-2" onClick={onRetryLoad}>
                        Повторить
                    </button>
                </div>
            )}

            {!isLoading && !hasError && sessions.length === 0 && (
                <div className="text-muted">У вас пока нет завершенных тренировок.</div>
            )}

            {!isLoading && !hasError && sessions.length > 0 && (
                <div className="table-responsive">
                    <table className="table align-middle mb-0 quizlet-progress-history-table">
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Время</th>
                                <th>Повторено</th>
                                <th>Не выполнено</th>
                                <th>Ошибки</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map((session) => {
                                const isExpanded = expandedSessionId === session.id;
                                const sessionWords = sessionWordsById[session.id] ?? [];
                                const topics = getTopicsFromSessionWords(sessionWords);
                                const detailsLoading = loadingDetailsSessionId === session.id;

                                return (
                                    <Fragment key={session.id}>
                                        <tr
                                            className={`quizlet-progress-history-row ${
                                                isExpanded ? "is-expanded" : ""
                                            }`}
                                            onClick={() => onRowClick(session.id)}
                                        >
                                            <td>
                                                {toDateText(
                                                    session.ended_at ?? session.updated_at ?? session.started_at,
                                                )}
                                            </td>
                                            <td>{toDurationText(session.elapsed_seconds)}</td>
                                            <td>{session.correct_answers}</td>
                                            <td>{session.skipped_words}</td>
                                            <td>{session.incorrect_answers}</td>
                                        </tr>

                                        {isExpanded && (
                                            <tr className="quizlet-progress-history-details-row">
                                                <td colSpan={5}>
                                                    <div className="quizlet-progress-history-details-wrap">
                                                        <div className="quizlet-progress-history-details-title">
                                                            Повторенные темы
                                                        </div>

                                                        {detailsLoading && (
                                                            <div className="text-muted small">Загрузка деталей...</div>
                                                        )}

                                                        {!detailsLoading && topics.length === 0 && (
                                                            <div className="text-muted small">Темы не найдены.</div>
                                                        )}

                                                        {!detailsLoading && topics.length > 0 && (
                                                            <ul className="quizlet-progress-history-topics-list mb-0">
                                                                {topics.map((topic) => (
                                                                    <li key={`${session.id}_${topic}`}>{topic}</li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default QuizletProgressHistory;
