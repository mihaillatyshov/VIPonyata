import { useState } from "react";

import { cancelQuizletAssignmentTarget, quizletKeys, quizletQueries, TQuizletAssignmentListItem } from "api/quizlet";
import Loading from "components/Common/Loading";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getAssignmentModeLabel, getAssignmentTargetStatusLabel } from "./teacherQuizletUtils";

const AssignmentStatus = ({ stats }: { stats: TQuizletAssignmentListItem["stats"] }) => {
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
                    : "Задание не выполнено"
            }
        >
            {isDone ? (
                <span className="quizlet-assignment-card__status-emoji" role="img" aria-label="Задание выполнено">
                    🗾
                </span>
            ) : stats.cancelled > 0 ? (
                <i className="bi bi-dash-circle-fill fs-4 text-secondary" aria-hidden="true" />
            ) : (
                <span
                    className="quizlet-assignment-card__status-emoji quizlet-assignment-card__status-emoji--pending"
                    role="img"
                    aria-label="Задание не выполнено"
                >
                    🎐
                </span>
            )}
        </div>
    );
};

const TeacherAssignmentsListPage = () => {
    const queryClient = useQueryClient();
    const assignmentsQuery = useQuery(quizletQueries.assignments());
    const [listError, setListError] = useState<string | null>(null);
    const [cancellingTargetIds, setCancellingTargetIds] = useState<number[]>([]);

    const handleCancelTarget = async (targetId: number) => {
        setListError(null);
        setCancellingTargetIds((prev) => [...prev, targetId]);

        try {
            await cancelQuizletAssignmentTarget(targetId);
            await queryClient.invalidateQueries({ queryKey: quizletKeys.assignments() });
        } catch {
            setListError("Не удалось отменить задание");
        } finally {
            setCancellingTargetIds((prev) => prev.filter((item) => item !== targetId));
        }
    };

    if (assignmentsQuery.isPending) {
        return <Loading />;
    }

    if (assignmentsQuery.isError) {
        return <div className="text-danger">Не удалось загрузить назначенные задания</div>;
    }

    const assignments = assignmentsQuery.data.assignments;

    return (
        <div className="quizlet-main-container quizlet-main-container--plain">
            {listError && <div className="text-danger small mb-2">{listError}</div>}
            {assignments.length === 0 && <div className="text-muted">Пока нет назначенных заданий</div>}
            <div className="quizlet-assignment-list">
                {assignments.map((item) => (
                    <div key={item.assignment.id} className="card quizlet-assignment-card">
                        <div className="card-body quizlet-assignment-card__body">
                            <div className="quizlet-assignment-card__header">
                                <div className="quizlet-assignment-card__main">
                                    <div className="quizlet-assignment-card__title fw-semibold">
                                        {item.assignment.title}
                                    </div>
                                    <div className="quizlet-assignment-card__meta small text-muted">
                                        <span className="quizlet-assignment-pill">
                                            {getAssignmentModeLabel(item.assignment)}
                                        </span>
                                        <span className="quizlet-assignment-card__dictionaries">
                                            {item.subgroups.map((subgroup) => subgroup.title).join(", ") || "-"}
                                        </span>
                                    </div>
                                </div>
                                <AssignmentStatus stats={item.stats} />
                            </div>
                            {item.targets.length > 0 && (
                                <div className="quizlet-assignment-targets small">
                                    {item.targets.map((target) => {
                                        const statusLabel = getAssignmentTargetStatusLabel(target.status);
                                        const isCancelling = cancellingTargetIds.includes(target.id);

                                        return (
                                            <div key={target.id} className="quizlet-assignment-target-row">
                                                <div className="quizlet-assignment-target-row__main">
                                                    <div className="quizlet-assignment-target-row__student">
                                                        <span className="quizlet-assignment-target-row__nickname">
                                                            {target.student?.nickname ?? "unknown"}
                                                        </span>
                                                        <span className="text-muted">
                                                            {` (${target.student?.name ?? "unknown"})`}
                                                        </span>
                                                        <span
                                                            className={`quizlet-assignment-target-row__status ${statusLabel.className}`}
                                                        >
                                                            {statusLabel.text}
                                                        </span>
                                                    </div>
                                                    {target.personal_subgroups.length > 0 && (
                                                        <div className="quizlet-assignment-target-row__personal text-muted">
                                                            {`Личные: ${target.personal_subgroups.map((subgroup) => subgroup.title).join(", ")}`}
                                                        </div>
                                                    )}
                                                </div>
                                                {target.status === "pending" && (
                                                    <button
                                                        className="btn btn-sm quizlet-assignment-cancel-btn"
                                                        onClick={() => handleCancelTarget(target.id)}
                                                        disabled={isCancelling}
                                                    >
                                                        {isCancelling ? "Отмена..." : "Отменить"}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeacherAssignmentsListPage;
