import React, { Dispatch } from "react";
import { useNavigate } from "react-router-dom";

import { TTasksStudentOption } from "api/tasks";
import { AddBlockButton } from "components/Activities/Assessment/ProcessingPage/AddBlockButton";
import TeacherAssessmentTypeBase from "components/Activities/Assessment/ProcessingPage/Types/TeacherAssessmentTypeBase";
import { TAssessmentTaskName } from "models/Activity/Items/TAssessmentItems";

import { AssignmentWizardAction, AssignmentWizardState, isDraftInsertionInsideBlock } from "./assignmentWizard";
import TeacherTaskEditor from "./TeacherTaskEditor";

interface DraftTasksEditorProps {
    wizard: AssignmentWizardState;
    dispatch: Dispatch<AssignmentWizardAction>;
}

/** Черновик домашки: задания по порядку, блоки (BLOCK_BEGIN…BLOCK_END) обводятся рамкой. */
const DraftTasksEditor = ({ wizard, dispatch }: DraftTasksEditorProps) => {
    const { draftTasks } = wizard;

    const renderDraftTask = (index: number) => {
        const item = draftTasks[index];
        const isBlockBoundary =
            item.task.name === TAssessmentTaskName.BLOCK_BEGIN || item.task.name === TAssessmentTaskName.BLOCK_END;

        return (
            <React.Fragment key={item.client_id}>
                <div className="text-center">
                    {!isDraftInsertionInsideBlock(draftTasks, index) ? (
                        <AddBlockButton onClick={() => dispatch({ type: "addDraftBlock", index })} />
                    ) : null}
                </div>
                <div className="d-flex flex-column gap-3">
                    {!isBlockBoundary ? (
                        <div>
                            <label className="form-label">Название задания</label>
                            <input
                                className="form-control"
                                value={item.title}
                                onChange={(event) =>
                                    dispatch({ type: "changeDraftTitle", index, title: event.target.value })
                                }
                            />
                        </div>
                    ) : null}
                    <TeacherAssessmentTypeBase
                        taskName={item.task.name}
                        moveUp={() => dispatch({ type: "moveDraftTask", index, direction: "up" })}
                        moveDown={() => dispatch({ type: "moveDraftTask", index, direction: "down" })}
                        removeTask={() => dispatch({ type: "removeDraftTask", index })}
                    >
                        <TeacherTaskEditor
                            task={item.task}
                            onChangeTask={(task) => dispatch({ type: "changeDraftTask", index, task })}
                            taskUUID={item.client_id}
                        />
                    </TeacherAssessmentTypeBase>
                </div>
            </React.Fragment>
        );
    };

    const renderedTasks: React.ReactNode[] = [];
    for (let i = 0; i < draftTasks.length; i++) {
        if (draftTasks[i].task.name === TAssessmentTaskName.BLOCK_BEGIN) {
            const blockEndIndex = draftTasks.findIndex(
                (item, itemIndex) => itemIndex > i && item.task.name === TAssessmentTaskName.BLOCK_END,
            );

            if (blockEndIndex !== -1) {
                renderedTasks.push(
                    <div className="teacher-assessment-block-container" key={`${draftTasks[i].client_id}-container`}>
                        {Array.from({ length: blockEndIndex - i + 1 }, (_, offset) => renderDraftTask(i + offset))}
                    </div>,
                );
                i = blockEndIndex;
                continue;
            }
        }

        renderedTasks.push(renderDraftTask(i));
    }

    return (
        <div className="d-flex flex-column gap-4">
            {renderedTasks}
            {!isDraftInsertionInsideBlock(draftTasks, draftTasks.length) ? (
                <div className="text-center">
                    <AddBlockButton onClick={() => dispatch({ type: "addDraftBlock", index: draftTasks.length })} />
                </div>
            ) : null}
        </div>
    );
};

interface TasksFinalizeStepProps {
    students: TTasksStudentOption[];
    wizard: AssignmentWizardState;
    dispatch: Dispatch<AssignmentWizardAction>;
    isCreating: boolean;
    onCreate: () => void;
}

/** Шаг 2 назначения: итоговое название, ученик и редактирование черновика перед отправкой. */
const TasksFinalizeStep = ({ students, wizard, dispatch, isCreating, onCreate }: TasksFinalizeStepProps) => {
    const navigate = useNavigate();
    const selectedStudent = students.find((student) => student.id === wizard.studentId) ?? null;

    return (
        <div className="row g-4">
            <div className="col-12 col-lg-4">
                <div className="card tasks-card h-100">
                    <div className="card-body d-flex flex-column gap-3">
                        <div className="d-flex justify-content-between align-items-center gap-2">
                            <h5 className="mb-0">Итоговое задание</h5>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => navigate("/tasks")}
                            >
                                Назад
                            </button>
                        </div>
                        <div>
                            <label className="form-label">Название задания</label>
                            <input
                                className="form-control"
                                value={wizard.title}
                                onChange={(event) => dispatch({ type: "setTitle", title: event.target.value })}
                                placeholder="Название задания"
                            />
                        </div>
                        <div>
                            <label className="form-label">Ученик</label>
                            <select
                                className="form-select"
                                value={wizard.studentId ?? ""}
                                onChange={(event) =>
                                    dispatch({
                                        type: "setStudent",
                                        studentId: event.target.value ? Number(event.target.value) : null,
                                    })
                                }
                            >
                                <option value="">Выберите ученика</option>
                                {students.map((student) => (
                                    <option key={student.id} value={student.id}>
                                        {student.nickname} ({student.name})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="small text-muted">
                            {selectedStudent
                                ? `Задание будет отправлено ученику ${selectedStudent.nickname}.`
                                : "Выберите ученика для отправки задания."}
                        </div>
                        <button
                            type="button"
                            className="btn btn-success"
                            onClick={onCreate}
                            disabled={isCreating || wizard.draftTasks.length === 0 || wizard.studentId === null}
                        >
                            {isCreating ? "Отправляем..." : "Отправить задание"}
                        </button>
                    </div>
                </div>
            </div>
            <div className="col-12 col-lg-8">
                <div className="card tasks-card">
                    <div className="card-body d-flex flex-column gap-3">
                        <div>
                            <h5 className="mb-1">Проверка и редактирование</h5>
                            <div className="small text-muted">
                                Можно изменить названия, содержание, порядок задач и объединить их в блоки.
                            </div>
                        </div>
                        {wizard.draftTasks.length === 0 ? (
                            <div className="text-muted">Нет выбранных задач. Вернитесь на предыдущий шаг.</div>
                        ) : (
                            <DraftTasksEditor wizard={wizard} dispatch={dispatch} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TasksFinalizeStep;
