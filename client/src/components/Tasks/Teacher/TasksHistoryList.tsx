import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { cancelHomeworkAssignmentTarget, tasksKeys, THomeworkAssignmentListItem, TTasksLessonOption } from "api/tasks";

import { useQueryClient } from "@tanstack/react-query";

import {
    formatDateTime,
    getHomeworkAssignmentLessonLabels,
    getHomeworkAssignmentTypeLabels,
    getHomeworkTargetStatusLabel,
} from "./tasksUtils";

const HISTORY_PAGE_SIZE = 10;

const AssignmentStatus = ({ stats }: { stats: THomeworkAssignmentListItem["stats"] }) => {
    const isDone = stats.pending === 0 && stats.cancelled === 0;
    const isPending = stats.pending > 0 && stats.cancelled === 0;

    return (
        <div
            className={`quizlet-assignment-card__status ${isDone || isPending ? "quizlet-assignment-card__status--emoji" : ""}`}
            title={
                stats.pending === 0
                    ? stats.cancelled > 0
                        ? "Есть отмененные назначения"
                        : "Задание выполнено"
                    : "Задание ожидает выполнения"
            }
        >
            {isDone ? (
                <span className="quizlet-assignment-card__status-emoji" role="img" aria-label="Задание выполнено">
                    🎋
                </span>
            ) : stats.cancelled > 0 ? (
                <i className="bi bi-dash-circle-fill fs-4 text-secondary" aria-hidden="true" />
            ) : (
                <span
                    className="quizlet-assignment-card__status-emoji quizlet-assignment-card__status-emoji--pending"
                    role="img"
                    aria-label="Задание ожидает выполнения"
                >
                    🍵
                </span>
            )}
        </div>
    );
};

interface TasksHistoryListProps {
    assignments: THomeworkAssignmentListItem[];
    lessons: TTasksLessonOption[];
    onError: (message: string | null) => void;
}

/** Вкладка «Назначенное»: домашки с учениками, результатами и отменой. Показывается по 10. */
const TasksHistoryList = ({ assignments, lessons, onError }: TasksHistoryListProps) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [visibleCount, setVisibleCount] = useState(HISTORY_PAGE_SIZE);
    const [cancellingTargetIds, setCancellingTargetIds] = useState<number[]>([]);

    const visibleAssignments = assignments.slice(0, visibleCount);

    const cancelTarget = async (targetId: number) => {
        setCancellingTargetIds((prev) => [...prev, targetId]);
        try {
            await cancelHomeworkAssignmentTarget(targetId);
            await queryClient.invalidateQueries({ queryKey: tasksKeys.assignments() });
        } catch {
            onError("Не удалось отменить назначенное задание");
        } finally {
            setCancellingTargetIds((prev) => prev.filter((id) => id !== targetId));
        }
    };

    return (
        <div className="d-flex flex-column gap-3">
            {assignments.length === 0 ? <div className="text-muted">Пока нет назначенных заданий</div> : null}
            <div className="quizlet-assignment-list tasks-history-list">
                {visibleAssignments.map((item) => {
                    const taskTypeLabels = getHomeworkAssignmentTypeLabels(item.tasks);
                    const lessonLabels = getHomeworkAssignmentLessonLabels(item.tasks, lessons);

                    return (
                        <div key={item.assignment.id} className="card quizlet-assignment-card">
                            <div className="card-body quizlet-assignment-card__body">
                                <div className="quizlet-assignment-card__header">
                                    <div className="quizlet-assignment-card__main">
                                        <div className="quizlet-assignment-card__title fw-semibold">
                                            {item.assignment.title}
                                        </div>
                                        <div className="quizlet-assignment-card__meta small text-muted">
                                            <span>{formatDateTime(item.assignment.created_at)}</span>
                                        </div>
                                    </div>
                                    <AssignmentStatus stats={item.stats} />
                                </div>

                                <div className="tasks-history-card__chips-wrap">
                                    {taskTypeLabels.length > 0 ? (
                                        <div className="tasks-history-card__chips">
                                            {taskTypeLabels.map((label) => (
                                                <span key={`type-${label}`} className="quizlet-assignment-pill">
                                                    {label}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}
                                    {lessonLabels.length > 0 ? (
                                        <div className="tasks-history-card__chips tasks-history-card__chips--lessons">
                                            {lessonLabels.map((label) => (
                                                <span
                                                    key={`lesson-${label}`}
                                                    className="quizlet-assignment-pill tasks-history-card__lesson-pill"
                                                >
                                                    {label}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>

                                {item.targets.length > 0 ? (
                                    <div className="quizlet-assignment-targets small">
                                        {item.targets.map((target) => {
                                            const statusLabel = getHomeworkTargetStatusLabel(target.status);
                                            const resultId = target.result?.id;

                                            return (
                                                <div key={target.id} className="quizlet-assignment-target-row">
                                                    <div className="quizlet-assignment-target-row__main">
                                                        <div className="quizlet-assignment-target-row__student">
                                                            <span className="quizlet-assignment-target-row__nickname">
                                                                {target.student?.nickname ?? "unknown"}
                                                            </span>
                                                            <span className="text-muted">
                                                                {`(${target.student?.name ?? "unknown"})`}
                                                            </span>
                                                            <span
                                                                className={`quizlet-assignment-target-row__status ${statusLabel.className}`}
                                                            >
                                                                {statusLabel.text}
                                                            </span>
                                                        </div>
                                                        <div className="tasks-history-card__target-meta text-muted">
                                                            <span>
                                                                Завершено: {formatDateTime(target.completed_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex gap-2 flex-wrap">
                                                        {resultId !== undefined ? (
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => navigate(`/tasks/tries/${resultId}`)}
                                                            >
                                                                Результат
                                                            </button>
                                                        ) : null}
                                                        {target.status === "pending" ? (
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm quizlet-assignment-cancel-btn"
                                                                onClick={() => cancelTarget(target.id)}
                                                                disabled={cancellingTargetIds.includes(target.id)}
                                                            >
                                                                Отменить
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>
            {visibleAssignments.length < assignments.length ? (
                <div className="d-flex justify-content-center">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setVisibleCount((prev) => prev + HISTORY_PAGE_SIZE)}
                    >
                        Показать еще 10
                    </button>
                </div>
            ) : null}
        </div>
    );
};

export default TasksHistoryList;
