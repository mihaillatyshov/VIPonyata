import { Dispatch, useMemo } from "react";

import { TTasksOptions } from "api/tasks";
import { AssessmentTaskPreviewContent } from "components/Activities/Assessment/AssessmentTaskPreview";
import { assessmentTaskRusNameAliases } from "models/Activity/Items/TAssessmentItems";
import { TTaskBankItem } from "models/TTasks";

import { AssignmentWizardAction, AssignmentWizardState } from "./assignmentWizard";
import { groupTaskBankItemsByBlock } from "./tasksUtils";

interface TasksAssignStepProps {
    options: TTasksOptions;
    bankItems: TTaskBankItem[];
    wizard: AssignmentWizardState;
    dispatch: Dispatch<AssignmentWizardAction>;
    /** Задания выбранных уроков (выбор и предпросмотр ограничены ими). */
    availableTasks: TTaskBankItem[];
    selectedTaskIds: number[];
    onConfirm: () => void;
}

const CompletionMark = ({ item }: { item: TTaskBankItem }) =>
    item.completion_count && item.completion_count > 0 ? (
        <span className="text-info">✓ {item.completion_count}</span>
    ) : (
        <span className="text-secondary">✕</span>
    );

/** Шаг 1 назначения: название, ученик, уроки, выбор заданий и предпросмотр. */
const TasksAssignStep = ({
    options,
    bankItems,
    wizard,
    dispatch,
    availableTasks,
    selectedTaskIds,
    onConfirm,
}: TasksAssignStepProps) => {
    const previewTask = availableTasks.find((item) => item.id === wizard.previewTaskId) ?? availableTasks[0] ?? null;

    // Задания выбранных уроков, сгруппированные по уроку (в порядке банка).
    const tasksByLesson = useMemo(() => {
        const lessonMap = new Map<number | null, TTaskBankItem[]>();
        bankItems.forEach((item) => {
            if (!wizard.lessonIds.includes(item.lesson_id ?? -1)) {
                return;
            }
            const list = lessonMap.get(item.lesson_id ?? null) ?? [];
            list.push(item);
            lessonMap.set(item.lesson_id ?? null, list);
        });
        return [...lessonMap.entries()];
    }, [bankItems, wizard.lessonIds]);

    return (
        <div className="row g-4">
            <div className="col-12">
                <div className="row g-4">
                    <div className="col-12 col-xl-5">
                        <div className="card tasks-card h-100">
                            <div className="card-body d-flex flex-column gap-3">
                                <div>
                                    <label className="form-label">Название задания</label>
                                    <input
                                        className="form-control"
                                        value={wizard.title}
                                        onChange={(event) => dispatch({ type: "setTitle", title: event.target.value })}
                                        placeholder="Например: Домашнее задание 7"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Ученик</label>
                                    <div className="tasks-scroll-list border rounded p-2">
                                        {options.students.map((student) => (
                                            <label key={student.id} className="d-flex align-items-center gap-2 py-1">
                                                <input
                                                    type="checkbox"
                                                    checked={wizard.studentId === student.id}
                                                    onChange={() =>
                                                        dispatch({ type: "toggleStudent", studentId: student.id })
                                                    }
                                                />
                                                <span>
                                                    {student.nickname} ({student.name})
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-xl-7">
                        <div className="card tasks-card h-100">
                            <div className="card-body d-flex flex-column gap-3">
                                <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
                                    <div>
                                        <h5 className="mb-1">Уроки</h5>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={onConfirm}
                                        disabled={selectedTaskIds.length === 0 || wizard.studentId === null}
                                    >
                                        Подтвердить
                                    </button>
                                </div>
                                <div className="tasks-scroll-list border rounded p-2">
                                    {options.lessons.map((lesson) => (
                                        <label key={lesson.id} className="d-flex align-items-center gap-2 py-1">
                                            <input
                                                type="checkbox"
                                                checked={wizard.lessonIds.includes(lesson.id)}
                                                onChange={() => dispatch({ type: "toggleLesson", lessonId: lesson.id })}
                                            />
                                            <span>{lesson.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-12 col-xl-6">
                <div className="card tasks-card h-100">
                    <div className="card-body d-flex flex-column gap-3">
                        <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
                            <div>
                                <h5 className="mb-1">Задания из выбранных уроков</h5>
                            </div>
                        </div>
                        {wizard.lessonIds.length === 0 ? (
                            <div className="text-muted">Сначала выберите один или несколько уроков сверху.</div>
                        ) : availableTasks.length === 0 ? (
                            <div className="text-muted">В выбранных уроках пока нет заданий.</div>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                {tasksByLesson.map(([lessonId, items]) => (
                                    <div key={lessonId ?? "unsorted"}>
                                        <div className="tasks-group-title">
                                            {options.lessons.find((item) => item.id === lessonId)?.name ??
                                                "Нерассортированное"}
                                        </div>
                                        <div className="d-flex flex-column gap-3">
                                            {groupTaskBankItemsByBlock(items).map((group) => (
                                                <div key={group.key}>
                                                    <div className="small fw-semibold text-secondary mb-2">
                                                        {group.title}
                                                    </div>
                                                    <div className="d-flex flex-column gap-2">
                                                        {group.items.map((item) => (
                                                            <button
                                                                type="button"
                                                                key={item.id}
                                                                className={`tasks-bank-item tasks-assign-task-card border rounded p-3 text-start ${previewTask?.id === item.id ? "tasks-assign-task-card--active" : ""}`}
                                                                onClick={() =>
                                                                    dispatch({ type: "setPreview", taskId: item.id })
                                                                }
                                                            >
                                                                <div className="d-flex justify-content-between align-items-start gap-3">
                                                                    <div className="d-flex gap-2 align-items-start">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedTaskIds.includes(item.id)}
                                                                            onChange={(event) => {
                                                                                event.stopPropagation();
                                                                                dispatch({
                                                                                    type: "toggleTask",
                                                                                    taskId: item.id,
                                                                                });
                                                                            }}
                                                                        />
                                                                        <div>
                                                                            <div className="fw-semibold">
                                                                                {item.title}
                                                                            </div>
                                                                            <div className="small text-muted">
                                                                                {
                                                                                    assessmentTaskRusNameAliases[
                                                                                        item.task.name
                                                                                    ]
                                                                                }
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="small text-nowrap">
                                                                        {wizard.studentId === null ? null : (
                                                                            <CompletionMark item={item} />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="col-12 col-xl-6">
                <div className="card tasks-card">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0">Предпросмотр</h5>
                        </div>
                        {previewTask === null ? (
                            <div className="text-muted">
                                Выберите задание слева, чтобы увидеть его содержание и ответы.
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                <div>
                                    <div className="small text-muted mb-1">
                                        {options.lessons.find((lesson) => lesson.id === previewTask.lesson_id)?.name ??
                                            "Без урока"}
                                    </div>
                                    <h5 className="mb-1">{previewTask.title}</h5>
                                    <div className="small text-muted">
                                        {assessmentTaskRusNameAliases[previewTask.task.name]}
                                    </div>
                                </div>
                                <div className="tasks-preview-surface">
                                    <AssessmentTaskPreviewContent task={previewTask.task} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TasksAssignStep;
