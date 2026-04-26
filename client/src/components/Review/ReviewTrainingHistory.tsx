import { Fragment } from "react";

import "components/Quizlet/QuizletProgressHistory.css";
import "components/Quizlet/QuizletShared.css";

export interface ReviewTrainingHistoryEntry {
    id: string;
    startedAt: number;
    endedAt: number;
    elapsedSeconds: number;
    reviewedWords: number;
    skippedWords: number;
    incorrectAnswers: number;
    totalWords: number;
    direction: "jp_to_ru" | "ru_to_jp";
    easyCount: number;
    partialCount: number;
    forgotCount: number;
    topicTitles: string[];
}

interface Props {
    entries: ReviewTrainingHistoryEntry[];
    expandedEntryId: string | null;
    hasStorageError: boolean;
    onRowClick: (entryId: string) => void;
}

const toDateText = (value: number) => {
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

const getDirectionLabel = (direction: ReviewTrainingHistoryEntry["direction"]) =>
    direction === "jp_to_ru" ? "jp → ru" : "ru → jp";

const ReviewTrainingHistory = ({ entries, expandedEntryId, hasStorageError, onRowClick }: Props) => {
    return (
        <div className="quizlet-main-container quizlet-results quizlet-progress-history review-training-history">
            <h2 className="quizlet-results-title quizlet-progress-history-title">История</h2>

            {hasStorageError && (
                <div className="alert alert-warning mb-3">
                    Не удалось полностью прочитать историю тренировок из браузера. Новые попытки будут сохраняться
                    заново.
                </div>
            )}

            {entries.length === 0 && <div className="text-muted">Завершённых тренировок пока нет.</div>}

            {entries.length > 0 && (
                <div className="table-responsive">
                    <table className="table align-middle mb-0 quizlet-progress-history-table">
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Время</th>
                                <th>Повторено</th>
                                <th>Не выполнено</th>
                                <th>Частично</th>
                                <th>Забыла</th>
                                <th>Ошибки</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry) => {
                                const isExpanded = expandedEntryId === entry.id;

                                return (
                                    <Fragment key={entry.id}>
                                        <tr
                                            className={`quizlet-progress-history-row ${isExpanded ? "is-expanded" : ""}`}
                                            onClick={() => onRowClick(entry.id)}
                                        >
                                            <td>{toDateText(entry.endedAt)}</td>
                                            <td>{toDurationText(entry.elapsedSeconds)}</td>
                                            <td>{entry.reviewedWords}</td>
                                            <td>{entry.skippedWords}</td>
                                            <td>{entry.partialCount}</td>
                                            <td>{entry.forgotCount}</td>
                                            <td>{entry.incorrectAnswers}</td>
                                        </tr>

                                        {isExpanded && (
                                            <tr className="quizlet-progress-history-details-row">
                                                <td colSpan={7}>
                                                    <div className="quizlet-progress-history-details-wrap review-history-details-wrap">
                                                        <div className="review-history-detail-grid">
                                                            <div>
                                                                <div className="quizlet-progress-history-details-title">
                                                                    Режим
                                                                </div>
                                                                <div className="text-muted small">
                                                                    {getDirectionLabel(entry.direction)}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="quizlet-progress-history-details-title">
                                                                    Итог
                                                                </div>
                                                                <div className="review-history-badges">
                                                                    <span className="badge text-bg-success">
                                                                        Помню сразу: {entry.easyCount}
                                                                    </span>
                                                                    <span className="badge text-bg-warning">
                                                                        Частично: {entry.partialCount}
                                                                    </span>
                                                                    <span className="badge text-bg-danger">
                                                                        Забыла: {entry.forgotCount}
                                                                    </span>
                                                                    <span className="badge text-bg-secondary">
                                                                        Всего: {entry.totalWords}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="quizlet-progress-history-details-title mt-3">
                                                            Повторенные темы
                                                        </div>

                                                        {entry.topicTitles.length === 0 ? (
                                                            <div className="text-muted small">Темы не найдены.</div>
                                                        ) : (
                                                            <ul className="quizlet-progress-history-topics-list mb-0">
                                                                {entry.topicTitles.map((topicTitle) => (
                                                                    <li key={`${entry.id}_${topicTitle}`}>
                                                                        {topicTitle}
                                                                    </li>
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

export default ReviewTrainingHistory;
