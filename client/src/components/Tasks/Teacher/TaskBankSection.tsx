import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    deleteTaskBankItem,
    saveTaskBankItem,
    setTaskBankLessonHidden,
    tasksKeys,
    TTaskBank,
    TTaskBankItemDraft,
    TTasksLessonOption,
} from "api/tasks";
import SelectTypeModal from "components/Activities/Assessment/ProcessingPage/SelectTypeModal";
import {
    assessmentTaskRusNameAliases,
    getTeacherAssessmentTaskDefaultData,
    TAssessmentTaskName,
} from "models/Activity/Items/TAssessmentItems";
import { TTaskBankItem } from "models/TTasks";

import { useQueryClient } from "@tanstack/react-query";

import TaskBankLessonCards from "./TaskBankLessonCards";
import { buildTaskLessonCards, groupTaskBankItemsByBlock } from "./tasksUtils";
import TeacherTaskEditor from "./TeacherTaskEditor";

const TaskBankLessonBreadcrumb = ({ lessonName }: { lessonName?: string | null }) => (
    <div className="tasks-bank-breadcrumb d-flex align-items-center gap-2 flex-wrap">
        <Link to="/tasks/bank" className="tasks-bank-breadcrumb-link">
            Банк
        </Link>
        <span className="text-muted">/</span>
        <span>{lessonName ?? "Урок"}</span>
    </div>
);

interface TaskBankItemEditorProps {
    editor: TTaskBankItemDraft;
    lessons: TTasksLessonOption[];
    isSaving: boolean;
    onChange: (update: (editor: TTaskBankItemDraft) => TTaskBankItemDraft) => void;
    onSave: () => void;
    onCancel: () => void;
}

const TaskBankItemEditor = ({ editor, lessons, isSaving, onChange, onSave, onCancel }: TaskBankItemEditorProps) => (
    <>
        <div className="tasks-editor-meta-row">
            <div className="tasks-editor-title-field">
                <label className="form-label">Название</label>
                <input
                    className="form-control"
                    value={editor.title}
                    onChange={(event) => {
                        const title = event.target.value;
                        onChange((prev) => ({ ...prev, title }));
                    }}
                />
            </div>
            <div className="tasks-editor-lesson-field">
                <label className="form-label">Урок</label>
                <select
                    className="form-select"
                    value={editor.lesson_id ?? ""}
                    onChange={(event) => {
                        const lessonId = event.target.value ? Number(event.target.value) : null;
                        onChange((prev) => ({ ...prev, lesson_id: lessonId }));
                    }}
                >
                    <option value="">Нерассортированное</option>
                    {lessons.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                            {lesson.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
        <div className="tasks-editor-surface">
            <div className="tasks-editor-title">{assessmentTaskRusNameAliases[editor.task.name]}</div>
            <TeacherTaskEditor task={editor.task} onChangeTask={(task) => onChange((prev) => ({ ...prev, task }))} />
        </div>
        <div className="d-flex gap-2">
            <button type="button" className="btn btn-success" onClick={onSave} disabled={isSaving}>
                {isSaving ? "Сохраняем..." : editor.id === undefined ? "Создать" : "Сохранить"}
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
                Отмена
            </button>
        </div>
    </>
);

interface LessonTaskListProps {
    items: TTaskBankItem[];
    onOpen: (item: TTaskBankItem) => void;
    onDelete: (itemId: number) => void;
}

const LessonTaskList = ({ items, onOpen, onDelete }: LessonTaskListProps) => (
    <div className="d-flex flex-column gap-3 mt-3">
        {groupTaskBankItemsByBlock(items).map((group) => (
            <div key={group.key}>
                <div className="small fw-semibold text-secondary mb-2">{group.title}</div>
                <div className="d-flex flex-column gap-3">
                    {group.items.map((item) => (
                        <button
                            type="button"
                            key={item.id}
                            className="tasks-bank-lesson-item border rounded p-3 bg-white text-start"
                            onClick={() => onOpen(item)}
                        >
                            <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                                <div>
                                    <div className="fw-semibold">{item.title}</div>
                                </div>
                                <div className="d-flex gap-2">
                                    <button
                                        type="button"
                                        className="tasks-delete-icon-btn"
                                        aria-label="Удалить"
                                        title="Удалить"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onDelete(item.id);
                                        }}
                                    >
                                        <i className="bi bi-x-lg" />
                                    </button>
                                </div>
                            </div>
                            <div className="small text-muted">{assessmentTaskRusNameAliases[item.task.name]}</div>
                        </button>
                    ))}
                </div>
            </div>
        ))}
        {items.length === 0 ? <div className="text-muted">Для этого урока заданий пока нет.</div> : null}
    </div>
);

interface TaskBankSectionProps {
    lessons: TTasksLessonOption[];
    bank: TTaskBank;
    /** undefined — список уроков; null — «Нерассортированное»; число — урок. */
    currentLessonId: number | null | undefined;
    onError: (message: string | null) => void;
}

/** Вкладка «Банк заданий»: карточки уроков или задания урока с редактором. */
const TaskBankSection = ({ lessons, bank, currentLessonId, onError }: TaskBankSectionProps) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [editor, setEditor] = useState<TTaskBankItemDraft | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [processingLessonId, setProcessingLessonId] = useState<number | null>(null);

    const isLessonView = currentLessonId !== undefined;
    const refreshBank = () => queryClient.invalidateQueries({ queryKey: tasksKeys.bankAll() });

    const lessonCards = useMemo(
        () => buildTaskLessonCards(bank.items, lessons, bank.hidden_lesson_ids),
        [bank.items, bank.hidden_lesson_ids, lessons],
    );
    const lessonItems = isLessonView ? bank.items.filter((item) => item.lesson_id === currentLessonId) : [];
    const currentLessonName =
        currentLessonId === null ? "Нерассортированное" : lessons.find((lesson) => lesson.id === currentLessonId)?.name;
    const isCurrentLessonHidden =
        currentLessonId !== undefined && currentLessonId !== null && bank.hidden_lesson_ids.includes(currentLessonId);

    const setLessonHidden = async (lessonId: number, hidden: boolean) => {
        onError(null);
        setProcessingLessonId(lessonId);
        try {
            await setTaskBankLessonHidden(lessonId, hidden);
            if (hidden && currentLessonId === lessonId) {
                navigate("/tasks/bank");
            }
            await refreshBank();
            return true;
        } catch {
            onError(hidden ? "Не удалось скрыть урок из банка заданий" : "Не удалось вернуть урок в банк заданий");
            return false;
        } finally {
            setProcessingLessonId(null);
        }
    };

    const saveEditor = async () => {
        if (editor === null) {
            return;
        }

        onError(null);
        setIsSaving(true);
        try {
            await saveTaskBankItem(editor);
            setEditor(null);
            await refreshBank();
        } catch {
            onError("Не удалось сохранить задание в банк");
        } finally {
            setIsSaving(false);
        }
    };

    const deleteItem = async (itemId: number) => {
        onError(null);
        try {
            await deleteTaskBankItem(itemId);
            await refreshBank();
        } catch {
            onError("Не удалось удалить задание из банка");
        }
    };

    const openCreateEditor = (taskName: TAssessmentTaskName) => {
        setEditor({
            title: assessmentTaskRusNameAliases[taskName],
            lesson_id: null,
            task: getTeacherAssessmentTaskDefaultData(taskName),
        });
    };

    return (
        <div className="row g-4">
            <div className={isLessonView ? "col-12 col-lg-5 col-xl-4" : "col-12"}>
                <div className="card tasks-card">
                    <div className="card-body">
                        {!isLessonView ? (
                            <>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="mb-0">Банк заданий</h5>
                                </div>
                                <TaskBankLessonCards
                                    lessonCards={lessonCards}
                                    processingLessonId={processingLessonId}
                                    onSetLessonHidden={setLessonHidden}
                                />
                            </>
                        ) : (
                            <>
                                <div className="mb-3">
                                    <TaskBankLessonBreadcrumb lessonName={currentLessonName} />
                                </div>
                                {isCurrentLessonHidden ? (
                                    <div className="alert alert-secondary mt-3 d-flex justify-content-between align-items-center gap-2">
                                        <span>Этот урок скрыт в банке заданий.</span>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            disabled={processingLessonId === currentLessonId}
                                            onClick={() => setLessonHidden(currentLessonId as number, false)}
                                        >
                                            Вернуть в список
                                        </button>
                                    </div>
                                ) : null}
                                <LessonTaskList
                                    items={lessonItems}
                                    onOpen={(item) =>
                                        setEditor({
                                            id: item.id,
                                            title: item.title,
                                            lesson_id: item.lesson_id,
                                            task: item.task,
                                        })
                                    }
                                    onDelete={deleteItem}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
            {isLessonView ? (
                <div className="col-12 col-lg-7 col-xl-8">
                    <div className="card tasks-card sticky-xl-top" style={{ top: 12 }}>
                        <div className="card-body d-flex flex-column gap-3">
                            <div className="d-flex justify-content-between align-items-center gap-2">
                                <h5 className="mb-0">Редактор задания</h5>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={() => setShowTypeModal(true)}
                                >
                                    Добавить упражнение
                                </button>
                            </div>
                            {editor === null ? (
                                <div className="text-muted">
                                    Выберите задание для редактирования или создайте новое в этом уроке.
                                </div>
                            ) : (
                                <TaskBankItemEditor
                                    editor={editor}
                                    lessons={lessons}
                                    isSaving={isSaving}
                                    onChange={(update) => setEditor((prev) => (prev === null ? prev : update(prev)))}
                                    onSave={saveEditor}
                                    onCancel={() => setEditor(null)}
                                />
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
            <SelectTypeModal isShow={showTypeModal} close={() => setShowTypeModal(false)} addTasks={openCreateEditor} />
        </div>
    );
};

export default TaskBankSection;
