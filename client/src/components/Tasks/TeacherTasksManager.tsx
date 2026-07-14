import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { AddBlockButton } from "components/Activities/Assessment/ProcessingPage/AddBlockButton";
import {
    processingAliases,
    TAliasProp,
} from "components/Activities/Assessment/ProcessingPage/AssessmentProcessingUtils";
import SelectTypeModal from "components/Activities/Assessment/ProcessingPage/SelectTypeModal";
import TeacherAssessmentTypeBase, {
    TeacherAssessmentTypeProps,
} from "components/Activities/Assessment/ProcessingPage/Types/TeacherAssessmentTypeBase";
import Loading from "components/Common/Loading";
import PageTitle from "components/Common/PageTitle";
import ErrorPage from "components/ErrorPages/ErrorPage";
import { AjaxDelete, AjaxGet, AjaxPatch, AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { swapElements } from "libs/swapArrayElements";
import { uuid } from "libs/uuid";
import {
    assessmentTaskRusNameAliases,
    getTeacherAssessmentTaskDefaultData,
    TAssessmentItemBase,
    TAssessmentTaskName,
    TGetAssessmentTeacherTypeByName,
    TTeacherAssessmentAnyItem,
} from "models/Activity/Items/TAssessmentItems";
import { THomeworkAssignment, THomeworkAssignmentTask, THomeworkTry, TTaskBankItem } from "models/TTasks";

import "components/Quizlet/QuizletShared.css";
import "./TasksShared.css";

import HomeworkResultPage from "./HomeworkResultPage";

type TabKey = "assign" | "bank" | "history";

interface StudentOption {
    id: number;
    name: string;
    nickname: string;
}

interface LessonOption {
    id: number;
    name: string;
    number: number;
    course_id: number;
    img?: string | null;
}

interface TasksOptionsResponse {
    students: StudentOption[];
    lessons: LessonOption[];
    hidden_lesson_ids: number[];
}

interface TaskBankResponse {
    lessons: LessonOption[];
    items: TTaskBankItem[];
    hidden_lesson_ids: number[];
}

interface HomeworkAssignmentListItem {
    assignment: THomeworkAssignment;
    tasks: THomeworkAssignmentTask[];
    targets: Array<{
        id: number;
        student: StudentOption | null;
        status: "pending" | "completed" | "cancelled";
        assigned_at: string;
        completed_at: string | null;
        result: THomeworkTry | null;
    }>;
    stats: {
        total: number;
        completed: number;
        pending: number;
        cancelled: number;
    };
}

interface HomeworkAssignmentsResponse {
    assignments: HomeworkAssignmentListItem[];
}

type TTeacherAliasProp<T extends TAssessmentItemBase> = (props: TeacherAssessmentTypeProps<T>) => React.ReactElement;

type TTeacherAliases = {
    [key in TAssessmentTaskName]: TTeacherAliasProp<TGetAssessmentTeacherTypeByName[key]>;
};

const teacherAliases: TTeacherAliases = processingAliases;

interface BankEditorState {
    id?: number;
    title: string;
    lesson_id: number | null;
    task: TTeacherAssessmentAnyItem;
}

interface TaskBlockGroup {
    key: string;
    title: string;
    items: TTaskBankItem[];
}

interface TaskLessonGroup {
    key: string;
    title: string;
    items: TTaskBankItem[];
}

interface TaskLessonCardItem {
    key: string;
    title: string;
    lesson_id: number | null;
    img?: string | null;
    items: TTaskBankItem[];
    blocksCount: number;
    isHidden: boolean;
}

interface AssignmentDraftTask {
    client_id: string;
    task_bank_item_id: number | null;
    lesson_id: number | null;
    title: string;
    task: TTeacherAssessmentAnyItem;
}

const HISTORY_PAGE_SIZE = 10;

function findLastIndex<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => boolean): number {
    let length = array.length;
    while (length--) {
        if (predicate(array[length], length, array)) {
            return length;
        }
    }

    return -1;
}

const formatDateTime = (value: string | null) => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

const getHomeworkTargetStatusLabel = (status: HomeworkAssignmentListItem["targets"][number]["status"]) => {
    if (status === "completed") {
        return { text: "Выполнено", className: "text-success" };
    }

    if (status === "cancelled") {
        return { text: "Отменено", className: "text-muted" };
    }

    return { text: "Ожидает", className: "text-secondary" };
};

const getHomeworkAssignmentTypeLabels = (tasks: THomeworkAssignmentTask[]) => [
    ...new Set(tasks.map((task) => assessmentTaskRusNameAliases[task.task.name])),
];

const getHomeworkAssignmentLessonLabels = (tasks: THomeworkAssignmentTask[], lessons: LessonOption[]) => [
    ...new Set(
        tasks
            .map((task) => lessons.find((lesson) => lesson.id === task.lesson_id)?.name ?? null)
            .filter((lessonName): lessonName is string => lessonName !== null),
    ),
];

const getTaskBlockTitle = (item: TTaskBankItem) => {
    if (item.source_block_index === null || item.source_block_index === undefined) {
        return "Без блока";
    }

    return `Блок ${item.source_block_index}`;
};

const groupTaskBankItemsByBlock = (items: TTaskBankItem[]) => {
    const blockMap = new Map<string, TaskBlockGroup>();

    items.forEach((item) => {
        const blockKey =
            item.source_block_index === null || item.source_block_index === undefined
                ? "no-block"
                : `block-${item.source_block_index}`;
        const currentGroup = blockMap.get(blockKey);

        if (currentGroup) {
            currentGroup.items.push(item);
            return;
        }

        blockMap.set(blockKey, {
            key: blockKey,
            title: getTaskBlockTitle(item),
            items: [item],
        });
    });

    return [...blockMap.values()];
};

const groupTaskBankItemsByLesson = (items: TTaskBankItem[], lessons: LessonOption[]) => {
    const lessonMap = new Map<string, TaskLessonGroup>();

    items.forEach((item) => {
        const lessonKey = item.lesson_id === null ? "lesson-none" : `lesson-${item.lesson_id}`;
        const currentGroup = lessonMap.get(lessonKey);

        if (currentGroup) {
            currentGroup.items.push(item);
            return;
        }

        const lesson = lessons.find((lessonItem) => lessonItem.id === item.lesson_id);
        lessonMap.set(lessonKey, {
            key: lessonKey,
            title: lesson?.name ?? "Нерассортированное",
            items: [item],
        });
    });

    return [...lessonMap.values()];
};

const getTaskLessonRoute = (lessonId: number | null) =>
    lessonId === null ? "/tasks/bank/lessons/unsorted" : `/tasks/bank/lessons/${lessonId}`;

const buildTaskLessonCards = (
    items: TTaskBankItem[],
    lessons: LessonOption[],
    hiddenLessonIds: number[],
): TaskLessonCardItem[] => {
    const itemsByLesson = new Map<number | null, TTaskBankItem[]>();

    items.forEach((item) => {
        const currentItems = itemsByLesson.get(item.lesson_id ?? null) ?? [];
        currentItems.push(item);
        itemsByLesson.set(item.lesson_id ?? null, currentItems);
    });

    const lessonCards = lessons.map((lesson) => {
        const lessonItems = itemsByLesson.get(lesson.id) ?? [];
        const blocksCount = new Set(
            lessonItems
                .map((item) => item.source_block_index)
                .filter((blockIndex) => blockIndex !== null && blockIndex !== undefined),
        ).size;

        return {
            key: `lesson-${lesson.id}`,
            title: lesson.name,
            lesson_id: lesson.id,
            img: lesson.img,
            items: lessonItems,
            blocksCount,
            isHidden: hiddenLessonIds.includes(lesson.id),
        };
    });

    const unsortedItems = itemsByLesson.get(null) ?? [];
    const unsortedBlocksCount = new Set(
        unsortedItems
            .map((item) => item.source_block_index)
            .filter((blockIndex) => blockIndex !== null && blockIndex !== undefined),
    ).size;

    return [
        ...lessonCards,
        {
            key: "lesson-unsorted",
            title: "Нерассортированное",
            lesson_id: null,
            img: null,
            items: unsortedItems,
            blocksCount: unsortedBlocksCount,
            isHidden: false,
        },
    ];
};

const createDraftTaskFromBankItem = (item: TTaskBankItem): AssignmentDraftTask => ({
    client_id: uuid(),
    task_bank_item_id: item.id,
    lesson_id: item.lesson_id,
    title: item.title,
    task: JSON.parse(JSON.stringify(item.task)) as TTeacherAssessmentAnyItem,
});

const createDraftBlockBoundaryTask = (taskName: TAssessmentTaskName.BLOCK_BEGIN | TAssessmentTaskName.BLOCK_END) => ({
    client_id: uuid(),
    task_bank_item_id: null,
    lesson_id: null,
    title: assessmentTaskRusNameAliases[taskName],
    task: getTeacherAssessmentTaskDefaultData(taskName),
});

const buildDraftTasksFromSelection = (items: TTaskBankItem[]): AssignmentDraftTask[] => {
    const nextDraftTasks: AssignmentDraftTask[] = [];
    let activeBlockKey: string | null = null;

    items.forEach((item) => {
        const currentBlockKey =
            item.source_block_index === null || item.source_block_index === undefined
                ? null
                : `${item.lesson_id ?? "no-lesson"}:${item.source_block_index}`;

        if (activeBlockKey !== currentBlockKey) {
            if (activeBlockKey !== null) {
                nextDraftTasks.push(createDraftBlockBoundaryTask(TAssessmentTaskName.BLOCK_END));
            }

            if (currentBlockKey !== null) {
                nextDraftTasks.push(createDraftBlockBoundaryTask(TAssessmentTaskName.BLOCK_BEGIN));
            }
        }

        nextDraftTasks.push(createDraftTaskFromBankItem(item));
        activeBlockKey = currentBlockKey;
    });

    if (activeBlockKey !== null) {
        nextDraftTasks.push(createDraftBlockBoundaryTask(TAssessmentTaskName.BLOCK_END));
    }

    return nextDraftTasks;
};

const TaskBankLessonBreadcrumb = ({ lessonName }: { lessonName?: string | null }) => {
    return (
        <div className="tasks-bank-breadcrumb d-flex align-items-center gap-2 flex-wrap">
            <Link to="/tasks/bank" className="tasks-bank-breadcrumb-link">
                Банк
            </Link>
            <span className="text-muted">/</span>
            <span>{lessonName ?? "Урок"}</span>
        </div>
    );
};

const renderTaskPreviewContent = (task: TTeacherAssessmentAnyItem) => {
    switch (task.name) {
        case TAssessmentTaskName.TEXT:
            return <div className="tasks-preview-copy">{task.text || "Текст не заполнен"}</div>;
        case TAssessmentTaskName.TEST_SINGLE:
            return (
                <div className="d-flex flex-column gap-3">
                    <div className="tasks-preview-copy">{task.question || "Вопрос не заполнен"}</div>
                    <div className="d-flex flex-column gap-2">
                        {task.options.map((option, index) => (
                            <div
                                key={`${task.name}-${index}`}
                                className={`tasks-preview-option ${task.meta_answer === index ? "tasks-preview-option--answer" : ""}`}
                            >
                                <span>{option || `Вариант ${index + 1}`}</span>
                                {task.meta_answer === index ? <span className="small fw-semibold">Ответ</span> : null}
                            </div>
                        ))}
                    </div>
                </div>
            );
        case TAssessmentTaskName.TEST_MULTI:
            return (
                <div className="d-flex flex-column gap-3">
                    <div className="tasks-preview-copy">{task.question || "Вопрос не заполнен"}</div>
                    <div className="d-flex flex-column gap-2">
                        {task.options.map((option, index) => {
                            const isAnswer = task.meta_answers.includes(index);
                            return (
                                <div
                                    key={`${task.name}-${index}`}
                                    className={`tasks-preview-option ${isAnswer ? "tasks-preview-option--answer" : ""}`}
                                >
                                    <span>{option || `Вариант ${index + 1}`}</span>
                                    {isAnswer ? <span className="small fw-semibold">Ответ</span> : null}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        case TAssessmentTaskName.FIND_PAIR:
            return (
                <div className="d-flex flex-column gap-2">
                    {task.meta_first.map((firstItem, index) => (
                        <div
                            key={`${task.name}-${index}`}
                            className="tasks-preview-option tasks-preview-option--answer"
                        >
                            <span>{firstItem || `Пара ${index + 1}`}</span>
                            <span>{task.meta_second[index] || "-"}</span>
                        </div>
                    ))}
                </div>
            );
        case TAssessmentTaskName.CREATE_SENTENCE:
        case TAssessmentTaskName.SENTENCE_ORDER:
            return (
                <div className="tasks-preview-chips">
                    {(task.meta_parts.length > 0 ? task.meta_parts : ["Части не заполнены"]).map((part, index) => (
                        <span key={`${task.name}-${index}`} className="tasks-preview-chip">
                            {part || "Пустая часть"}
                        </span>
                    ))}
                </div>
            );
        case TAssessmentTaskName.FILL_SPACES_EXISTS:
        case TAssessmentTaskName.FILL_SPACES_BY_HAND:
            return (
                <div className="d-flex flex-column gap-3">
                    <div className="tasks-preview-copy">{task.separates.join(" ___ ") || "Шаблон не заполнен"}</div>
                    <div>
                        <div className="small text-muted mb-2">Ответы</div>
                        <div className="tasks-preview-chips">
                            {(task.meta_answers.length > 0 ? task.meta_answers : ["Ответы не заполнены"]).map(
                                (answer, index) => (
                                    <span
                                        key={`${task.name}-${index}`}
                                        className="tasks-preview-chip tasks-preview-chip--answer"
                                    >
                                        {answer || "Пустой ответ"}
                                    </span>
                                ),
                            )}
                        </div>
                    </div>
                </div>
            );
        case TAssessmentTaskName.CLASSIFICATION:
            return (
                <div className="tasks-preview-classification">
                    {task.titles.map((title, index) => (
                        <div key={`${task.name}-${index}`} className="tasks-preview-column">
                            <div className="tasks-preview-column__title">{title || `Колонка ${index + 1}`}</div>
                            <div className="d-flex flex-column gap-2">
                                {(task.meta_answers[index] ?? []).map((answer, answerIndex) => (
                                    <div
                                        key={`${task.name}-${index}-${answerIndex}`}
                                        className="tasks-preview-chip tasks-preview-chip--answer"
                                    >
                                        {answer || "Пустое значение"}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            );
        case TAssessmentTaskName.OPEN_QUESTION:
            return (
                <div className="d-flex flex-column gap-3">
                    <div className="tasks-preview-copy">{task.question || "Вопрос не заполнен"}</div>
                    <div>
                        <div className="small text-muted mb-2">Ответ</div>
                        <div className="tasks-preview-copy tasks-preview-copy--answer">
                            {task.meta_answer || "Ответ не заполнен"}
                        </div>
                    </div>
                </div>
            );
        case TAssessmentTaskName.IMG:
            return (
                <div className="d-flex flex-column gap-3">
                    {task.url ? (
                        <img src={task.url} alt="Предпросмотр задания" className="tasks-preview-media" />
                    ) : null}
                    <div className="tasks-preview-copy">
                        {task.description || task.url || "Изображение не заполнено"}
                    </div>
                </div>
            );
        case TAssessmentTaskName.AUDIO:
            return (
                <div className="d-flex flex-column gap-3">
                    {task.url ? <audio controls className="w-100" src={task.url} /> : null}
                    <div className="tasks-preview-copy">{task.description || task.url || "Аудио не заполнено"}</div>
                </div>
            );
        case TAssessmentTaskName.BLOCK_BEGIN:
            return <div className="tasks-preview-copy">Начало блока</div>;
        case TAssessmentTaskName.BLOCK_END:
            return <div className="tasks-preview-copy">Конец блока</div>;
        default:
            return null;
    }
};

const TeacherTasksManager = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loadStatus, setLoadStatus] = useState<LoadStatus.Type>(LoadStatus.NONE);
    const [options, setOptions] = useState<TasksOptionsResponse>({ students: [], lessons: [], hidden_lesson_ids: [] });
    const [bankItems, setBankItems] = useState<TTaskBankItem[]>([]);
    const [assignments, setAssignments] = useState<HomeworkAssignmentListItem[]>([]);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [editor, setEditor] = useState<BankEditorState | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [statusStudentId, setStatusStudentId] = useState<number | null>(null);
    const [selectedLessonIds, setSelectedLessonIds] = useState<number[]>([]);
    const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
    const [previewTaskId, setPreviewTaskId] = useState<number | null>(null);
    const [assignmentTitle, setAssignmentTitle] = useState("");
    const [draftTasks, setDraftTasks] = useState<AssignmentDraftTask[]>([]);
    const [isSavingBankItem, setIsSavingBankItem] = useState(false);
    const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [cancellingTargetIds, setCancellingTargetIds] = useState<number[]>([]);
    const [showHiddenLessons, setShowHiddenLessons] = useState(false);
    const [confirmHideLessonId, setConfirmHideLessonId] = useState<number | null>(null);
    const [processingLessonId, setProcessingLessonId] = useState<number | null>(null);
    const [visibleHistoryCount, setVisibleHistoryCount] = useState(HISTORY_PAGE_SIZE);

    const activeTab: TabKey = location.pathname.startsWith("/tasks/bank")
        ? "bank"
        : location.pathname.startsWith("/tasks/history")
          ? "history"
          : "assign";
    const isTryRoute = location.pathname.startsWith("/tasks/tries/");
    const isFinalizeRoute = location.pathname === "/tasks/finalize";
    const bankLessonRouteMatch = location.pathname.match(/^\/tasks\/bank\/lessons\/(\d+|unsorted)$/);
    const isBankLessonRoute = bankLessonRouteMatch !== null;
    const currentBankLessonId =
        bankLessonRouteMatch === null
            ? undefined
            : bankLessonRouteMatch[1] === "unsorted"
              ? null
              : Number(bankLessonRouteMatch[1]);

    const fetchAll = useCallback(async (studentId: number | null) => {
        setLoadStatus(LoadStatus.LOADING);
        const [optionsJson, bankJson, assignmentsJson] = await Promise.all([
            AjaxGet<TasksOptionsResponse>({ url: "/api/tasks/options" }),
            AjaxGet<TaskBankResponse>({ url: `/api/tasks/bank${studentId ? `?student_id=${studentId}` : ""}` }),
            AjaxGet<HomeworkAssignmentsResponse>({ url: "/api/tasks/assignments" }),
        ]);
        setOptions({ ...optionsJson, hidden_lesson_ids: bankJson.hidden_lesson_ids });
        setBankItems(bankJson.items);
        setAssignments(assignmentsJson.assignments);
        setLoadStatus(LoadStatus.DONE);
    }, []);

    useEffect(() => {
        fetchAll(null).catch(() => setLoadStatus(LoadStatus.ERROR));
    }, [fetchAll]);

    useEffect(() => {
        if (statusStudentId === null) {
            return;
        }

        fetchAll(statusStudentId).catch(() => setLoadStatus(LoadStatus.ERROR));
    }, [fetchAll, statusStudentId]);

    useEffect(() => {
        setStatusStudentId(selectedStudentId);
    }, [selectedStudentId]);

    const groupedBankItems = useMemo(() => {
        const lessonMap = new Map<number | null, TTaskBankItem[]>();
        bankItems.forEach((item) => {
            if (selectedLessonIds.length > 0 && !selectedLessonIds.includes(item.lesson_id ?? -1)) {
                return;
            }
            const key = item.lesson_id ?? null;
            const list = lessonMap.get(key) ?? [];
            list.push(item);
            lessonMap.set(key, list);
        });
        return lessonMap;
    }, [bankItems, selectedLessonIds]);

    const selectedTasks = useMemo(
        () => bankItems.filter((item) => selectedTaskIds.includes(item.id)),
        [bankItems, selectedTaskIds],
    );

    const availableLessonTasks = useMemo(
        () =>
            bankItems.filter(
                (item) => selectedLessonIds.length > 0 && selectedLessonIds.includes(item.lesson_id ?? -1),
            ),
        [bankItems, selectedLessonIds],
    );

    const previewTask = useMemo(
        () => availableLessonTasks.find((item) => item.id === previewTaskId) ?? null,
        [availableLessonTasks, previewTaskId],
    );

    const selectedStudent = useMemo(
        () => options.students.find((student) => student.id === selectedStudentId) ?? null,
        [options.students, selectedStudentId],
    );

    const filteredBankItems = useMemo(() => {
        if (currentBankLessonId === undefined) {
            return [];
        }

        return bankItems.filter((item) => item.lesson_id === currentBankLessonId);
    }, [bankItems, currentBankLessonId]);
    const filteredBankLessonGroups = useMemo(
        () => groupTaskBankItemsByLesson(filteredBankItems, options.lessons),
        [filteredBankItems, options.lessons],
    );
    const taskLessonCards = useMemo(
        () => buildTaskLessonCards(bankItems, options.lessons, options.hidden_lesson_ids),
        [bankItems, options.hidden_lesson_ids, options.lessons],
    );
    const visibleTaskLessonCards = useMemo(() => taskLessonCards.filter((item) => !item.isHidden), [taskLessonCards]);
    const hiddenTaskLessonCards = useMemo(() => taskLessonCards.filter((item) => item.isHidden), [taskLessonCards]);
    const currentBankLesson = useMemo(() => {
        if (currentBankLessonId === undefined) {
            return null;
        }

        if (currentBankLessonId === null) {
            return { id: null, name: "Нерассортированное", img: null };
        }

        return options.lessons.find((lesson) => lesson.id === currentBankLessonId) ?? null;
    }, [currentBankLessonId, options.lessons]);
    const isCurrentLessonHidden =
        currentBankLessonId !== undefined &&
        currentBankLessonId !== null &&
        options.hidden_lesson_ids.includes(currentBankLessonId);

    const visibleAssignments = useMemo(
        () => assignments.slice(0, visibleHistoryCount),
        [assignments, visibleHistoryCount],
    );

    const hasMoreAssignments = visibleAssignments.length < assignments.length;

    useEffect(() => {
        if (availableLessonTasks.length === 0) {
            setPreviewTaskId(null);
            return;
        }

        if (previewTaskId === null || !availableLessonTasks.some((item) => item.id === previewTaskId)) {
            setPreviewTaskId(availableLessonTasks[0].id);
        }
    }, [availableLessonTasks, previewTaskId]);

    useEffect(() => {
        const availableTaskIds = new Set(availableLessonTasks.map((item) => item.id));
        setSelectedTaskIds((prev) => prev.filter((id) => availableTaskIds.has(id)));
    }, [availableLessonTasks]);

    useEffect(() => {
        setVisibleHistoryCount(HISTORY_PAGE_SIZE);
    }, [assignments]);

    const openCreateEditor = (taskName: TAssessmentTaskName) => {
        setEditor({
            title: assessmentTaskRusNameAliases[taskName],
            lesson_id: null,
            task: getTeacherAssessmentTaskDefaultData(taskName),
        });
    };

    const handleSaveBankItem = async () => {
        if (editor === null) {
            return;
        }

        setErrorMessage(null);
        setIsSavingBankItem(true);
        try {
            if (editor.id === undefined) {
                await AjaxPost({
                    url: "/api/tasks/bank",
                    body: editor,
                });
            } else {
                await AjaxPatch({
                    url: `/api/tasks/bank/${editor.id}`,
                    body: editor,
                });
            }
            setEditor(null);
            await fetchAll(statusStudentId);
        } catch {
            setErrorMessage("Не удалось сохранить задание в банк");
        } finally {
            setIsSavingBankItem(false);
        }
    };

    const handleDeleteBankItem = async (itemId: number) => {
        setErrorMessage(null);
        try {
            await AjaxDelete({ url: `/api/tasks/bank/${itemId}` });
            setSelectedTaskIds((prev) => prev.filter((id) => id !== itemId));
            await fetchAll(statusStudentId);
        } catch {
            setErrorMessage("Не удалось удалить задание из банка");
        }
    };

    const handleHideLesson = async (lessonId: number) => {
        setErrorMessage(null);
        setProcessingLessonId(lessonId);
        try {
            await AjaxPost({ url: `/api/tasks/bank/lessons/${lessonId}/hidden`, body: {} });
            setConfirmHideLessonId(null);
            setOptions((prev) =>
                prev.hidden_lesson_ids.includes(lessonId)
                    ? prev
                    : {
                          ...prev,
                          hidden_lesson_ids: [...prev.hidden_lesson_ids, lessonId],
                      },
            );
            if (currentBankLessonId === lessonId) {
                navigate("/tasks/bank");
            }
        } catch {
            setErrorMessage("Не удалось скрыть урок из банка заданий");
        } finally {
            setProcessingLessonId(null);
        }
    };

    const handleShowLesson = async (lessonId: number) => {
        setErrorMessage(null);
        setProcessingLessonId(lessonId);
        try {
            await AjaxDelete({ url: `/api/tasks/bank/lessons/${lessonId}/hidden` });
            setOptions((prev) => ({
                ...prev,
                hidden_lesson_ids: prev.hidden_lesson_ids.filter((id) => id !== lessonId),
            }));
        } catch {
            setErrorMessage("Не удалось вернуть урок в банк заданий");
        } finally {
            setProcessingLessonId(null);
        }
    };

    const handleCreateAssignment = async () => {
        if (selectedStudentId === null) {
            setErrorMessage("Выберите ученика");
            return;
        }
        if (draftTasks.length === 0) {
            setErrorMessage("Выберите хотя бы одно задание");
            return;
        }

        const blocks = draftTasks.filter(
            (item) =>
                item.task.name === TAssessmentTaskName.BLOCK_BEGIN || item.task.name === TAssessmentTaskName.BLOCK_END,
        );

        if (blocks.length % 2 !== 0) {
            setErrorMessage("Исправьте структуру блоков перед отправкой");
            return;
        }

        for (let i = 1; i < blocks.length; i++) {
            if (blocks[i].task.name === blocks[i - 1].task.name) {
                setErrorMessage("Исправьте структуру блоков перед отправкой");
                return;
            }
        }

        setErrorMessage(null);
        setIsCreatingAssignment(true);
        try {
            await AjaxPost({
                url: "/api/tasks/assignments",
                body: {
                    title: assignmentTitle.trim() || "Домашнее задание",
                    student_ids: [selectedStudentId],
                    tasks: draftTasks.map((item, index) => ({
                        task_bank_item_id: item.task_bank_item_id,
                        lesson_id: item.lesson_id,
                        sort: index,
                        title: item.title.trim() || "Задание",
                        task: item.task,
                    })),
                },
            });
            setAssignmentTitle("");
            setSelectedTaskIds([]);
            setDraftTasks([]);
            await fetchAll(statusStudentId);
            navigate("/tasks/history");
        } catch {
            setErrorMessage("Не удалось назначить задания");
        } finally {
            setIsCreatingAssignment(false);
        }
    };

    const handleCancelTarget = async (targetId: number) => {
        setCancellingTargetIds((prev) => [...prev, targetId]);
        try {
            await AjaxDelete({ url: `/api/tasks/assignment-targets/${targetId}` });
            await fetchAll(statusStudentId);
        } catch {
            setErrorMessage("Не удалось отменить назначенное задание");
        } finally {
            setCancellingTargetIds((prev) => prev.filter((id) => id !== targetId));
        }
    };

    const drawTeacherItem = (
        task: TTeacherAssessmentAnyItem,
        onChangeTask: (value: TTeacherAssessmentAnyItem) => void,
        taskUUID = "task-bank-editor",
    ) => {
        const component = teacherAliases[task.name] as TAliasProp<TTeacherAssessmentAnyItem>;
        return React.createElement(component, {
            data: task,
            onChangeTask,
            taskUUID,
        });
    };

    const handleConfirmSelection = () => {
        if (selectedStudentId === null) {
            setErrorMessage("Выберите ученика");
            return;
        }

        if (selectedLessonIds.length === 0) {
            setErrorMessage("Выберите хотя бы один урок");
            return;
        }

        if (selectedTasks.length === 0) {
            setErrorMessage("Выберите хотя бы одно задание");
            return;
        }

        setErrorMessage(null);
        if (assignmentTitle.trim() === "") {
            setAssignmentTitle("Домашнее задание");
        }
        setDraftTasks(buildDraftTasksFromSelection(selectedTasks));
        navigate("/tasks/finalize");
    };

    const isDraftInsertionInsideBlock = (insertionIndex: number) => {
        let depth = 0;

        for (let i = 0; i < insertionIndex; i++) {
            if (draftTasks[i].task.name === TAssessmentTaskName.BLOCK_BEGIN) {
                depth++;
                continue;
            }

            if (draftTasks[i].task.name === TAssessmentTaskName.BLOCK_END) {
                depth = Math.max(0, depth - 1);
            }
        }

        return depth > 0;
    };

    const addDraftBlock = (index: number) => {
        if (isDraftInsertionInsideBlock(index)) {
            return;
        }

        setDraftTasks((prev) => {
            const next = [...prev];
            next.splice(
                index,
                0,
                createDraftBlockBoundaryTask(TAssessmentTaskName.BLOCK_BEGIN),
                createDraftBlockBoundaryTask(TAssessmentTaskName.BLOCK_END),
            );
            return next;
        });
    };

    const handleMoveDraftTask = (index: number, direction: "up" | "down") => {
        const offset = direction === "up" ? -1 : 1;
        if (index + offset < 0 || index + offset >= draftTasks.length) {
            return;
        }

        setDraftTasks((prev) => {
            const next = [...prev];
            swapElements(next, index, index + offset);
            return next;
        });
    };

    const handleDraftTaskChange = (index: number, task: TTeacherAssessmentAnyItem) => {
        setDraftTasks((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, task } : item)));
    };

    const handleDraftTaskTitleChange = (index: number, title: string) => {
        setDraftTasks((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, title } : item)));
    };

    const handleRemoveDraftTask = (index: number) => {
        setDraftTasks((prev) => {
            const next = [...prev];
            const taskName = next[index]?.task.name;

            if (taskName === undefined) {
                return prev;
            }

            if (taskName === TAssessmentTaskName.BLOCK_BEGIN) {
                const endIndex = next.findIndex(
                    (item, itemIndex) => itemIndex > index && item.task.name === TAssessmentTaskName.BLOCK_END,
                );

                if (endIndex !== -1) {
                    next.splice(endIndex, 1);
                }
            }

            next.splice(index, 1);

            if (taskName === TAssessmentTaskName.BLOCK_END) {
                const beginIndex = findLastIndex(
                    next,
                    (item, itemIndex) => itemIndex < index && item.task.name === TAssessmentTaskName.BLOCK_BEGIN,
                );

                if (beginIndex !== -1) {
                    next.splice(beginIndex, 1);
                }
            }

            return next;
        });
    };

    const renderDraftTaskByIndex = (index: number) => {
        const item = draftTasks[index];
        const isBlockBoundaryTask =
            item.task.name === TAssessmentTaskName.BLOCK_BEGIN || item.task.name === TAssessmentTaskName.BLOCK_END;

        return (
            <React.Fragment key={item.client_id}>
                <div className="text-center">
                    {!isDraftInsertionInsideBlock(index) ? (
                        <AddBlockButton onClick={() => addDraftBlock(index)} />
                    ) : null}
                </div>
                <div className="d-flex flex-column gap-3">
                    {!isBlockBoundaryTask ? (
                        <div>
                            <label className="form-label">Название задания</label>
                            <input
                                className="form-control"
                                value={item.title}
                                onChange={(event) => handleDraftTaskTitleChange(index, event.target.value)}
                            />
                        </div>
                    ) : null}
                    <TeacherAssessmentTypeBase
                        taskName={item.task.name}
                        moveUp={() => handleMoveDraftTask(index, "up")}
                        moveDown={() => handleMoveDraftTask(index, "down")}
                        removeTask={() => handleRemoveDraftTask(index)}
                    >
                        {drawTeacherItem(item.task, (task) => handleDraftTaskChange(index, task), item.client_id)}
                    </TeacherAssessmentTypeBase>
                </div>
            </React.Fragment>
        );
    };

    const renderedDraftTasks: React.ReactNode[] = [];
    for (let i = 0; i < draftTasks.length; i++) {
        if (draftTasks[i].task.name === TAssessmentTaskName.BLOCK_BEGIN) {
            const blockEndIndex = draftTasks.findIndex(
                (item, itemIndex) => itemIndex > i && item.task.name === TAssessmentTaskName.BLOCK_END,
            );

            if (blockEndIndex !== -1) {
                renderedDraftTasks.push(
                    <div className="teacher-assessment-block-container" key={`${draftTasks[i].client_id}-container`}>
                        {Array.from({ length: blockEndIndex - i + 1 }, (_, offset) =>
                            renderDraftTaskByIndex(i + offset),
                        )}
                    </div>,
                );
                i = blockEndIndex;
                continue;
            }
        }

        renderedDraftTasks.push(renderDraftTaskByIndex(i));
    }

    if (isTryRoute) {
        return (
            <Routes>
                <Route path="tries/:tryId" element={<HomeworkResultPage />} />
            </Routes>
        );
    }

    if (loadStatus === LoadStatus.ERROR) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Не удалось загрузить раздел заданий"
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (loadStatus !== LoadStatus.DONE) {
        return <Loading />;
    }

    return (
        <div className="container pb-5" style={{ maxWidth: "1120px" }}>
            <PageTitle title="タスク" />
            <div className="d-flex flex-wrap gap-2 mb-3">
                <button
                    type="button"
                    className={`btn ${activeTab === "assign" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => navigate("/tasks")}
                >
                    Задания
                </button>
                <button
                    type="button"
                    className={`btn ${activeTab === "bank" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => navigate("/tasks/bank")}
                >
                    Банк заданий
                </button>
                <button
                    type="button"
                    className={`btn ${activeTab === "history" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => navigate("/tasks/history")}
                >
                    Назначенное
                </button>
            </div>

            {errorMessage ? <div className="alert alert-warning">{errorMessage}</div> : null}

            {activeTab === "assign" && !isFinalizeRoute ? (
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
                                                value={assignmentTitle}
                                                onChange={(e) => setAssignmentTitle(e.target.value)}
                                                placeholder="Например: Домашнее задание 7"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">Ученик</label>
                                            <div className="tasks-scroll-list border rounded p-2">
                                                {options.students.map((student) => (
                                                    <label
                                                        key={student.id}
                                                        className="d-flex align-items-center gap-2 py-1"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedStudentId === student.id}
                                                            onChange={() =>
                                                                setSelectedStudentId((prev) =>
                                                                    prev === student.id ? null : student.id,
                                                                )
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
                                                onClick={handleConfirmSelection}
                                                disabled={selectedTaskIds.length === 0 || selectedStudentId === null}
                                            >
                                                Подтвердить
                                            </button>
                                        </div>
                                        <div className="tasks-scroll-list border rounded p-2">
                                            {options.lessons.map((lesson) => (
                                                <label key={lesson.id} className="d-flex align-items-center gap-2 py-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedLessonIds.includes(lesson.id)}
                                                        onChange={() =>
                                                            setSelectedLessonIds((prev) =>
                                                                prev.includes(lesson.id)
                                                                    ? prev.filter((id) => id !== lesson.id)
                                                                    : [...prev, lesson.id],
                                                            )
                                                        }
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
                                {selectedLessonIds.length === 0 ? (
                                    <div className="text-muted">Сначала выберите один или несколько уроков сверху.</div>
                                ) : availableLessonTasks.length === 0 ? (
                                    <div className="text-muted">В выбранных уроках пока нет заданий.</div>
                                ) : (
                                    <div className="d-flex flex-column gap-3">
                                        {[...groupedBankItems.entries()]
                                            .filter(([lessonId]) => selectedLessonIds.includes(lessonId ?? -1))
                                            .map(([lessonId, items]) => {
                                                const lesson = options.lessons.find((item) => item.id === lessonId);
                                                const blockGroups = groupTaskBankItemsByBlock(items);
                                                return (
                                                    <div key={lessonId ?? "unsorted"}>
                                                        <div className="tasks-group-title">
                                                            {lesson?.name ?? "Нерассортированное"}
                                                        </div>
                                                        <div className="d-flex flex-column gap-3">
                                                            {blockGroups.map((group) => (
                                                                <div key={group.key}>
                                                                    <div className="small fw-semibold text-secondary mb-2">
                                                                        {group.title}
                                                                    </div>
                                                                    <div className="d-flex flex-column gap-2">
                                                                        {group.items.map((item) => {
                                                                            const isSelected = selectedTaskIds.includes(
                                                                                item.id,
                                                                            );
                                                                            const isPreviewActive =
                                                                                previewTaskId === item.id;
                                                                            return (
                                                                                <button
                                                                                    type="button"
                                                                                    key={item.id}
                                                                                    className={`tasks-bank-item tasks-assign-task-card border rounded p-3 text-start ${isPreviewActive ? "tasks-assign-task-card--active" : ""}`}
                                                                                    onClick={() =>
                                                                                        setPreviewTaskId(item.id)
                                                                                    }
                                                                                >
                                                                                    <div className="d-flex justify-content-between align-items-start gap-3">
                                                                                        <div className="d-flex gap-2 align-items-start">
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={isSelected}
                                                                                                onChange={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    setSelectedTaskIds(
                                                                                                        (prev) =>
                                                                                                            prev.includes(
                                                                                                                item.id,
                                                                                                            )
                                                                                                                ? prev.filter(
                                                                                                                      (
                                                                                                                          id,
                                                                                                                      ) =>
                                                                                                                          id !==
                                                                                                                          item.id,
                                                                                                                  )
                                                                                                                : [
                                                                                                                      ...prev,
                                                                                                                      item.id,
                                                                                                                  ],
                                                                                                    );
                                                                                                }}
                                                                                            />
                                                                                            <div>
                                                                                                <div className="fw-semibold">
                                                                                                    {item.title}
                                                                                                </div>
                                                                                                <div className="small text-muted">
                                                                                                    {
                                                                                                        assessmentTaskRusNameAliases[
                                                                                                            item.task
                                                                                                                .name
                                                                                                        ]
                                                                                                    }
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="small text-nowrap">
                                                                                            {statusStudentId ===
                                                                                            null ? null : item.completion_count &&
                                                                                              item.completion_count >
                                                                                                  0 ? (
                                                                                                <span className="text-info">
                                                                                                    ✓{" "}
                                                                                                    {
                                                                                                        item.completion_count
                                                                                                    }
                                                                                                </span>
                                                                                            ) : (
                                                                                                <span className="text-secondary">
                                                                                                    ✕
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
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
                                    {/* {previewTask ? <span className="small text-muted">Без редактирования</span> : null} */}
                                </div>
                                {previewTask === null ? (
                                    <div className="text-muted">
                                        Выберите задание слева, чтобы увидеть его содержание и ответы.
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column gap-3">
                                        <div>
                                            <div className="small text-muted mb-1">
                                                {options.lessons.find((lesson) => lesson.id === previewTask.lesson_id)
                                                    ?.name ?? "Без урока"}
                                            </div>
                                            <h5 className="mb-1">{previewTask.title}</h5>
                                            <div className="small text-muted">
                                                {assessmentTaskRusNameAliases[previewTask.task.name]}
                                            </div>
                                        </div>
                                        <div className="tasks-preview-surface">
                                            {renderTaskPreviewContent(previewTask.task)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {activeTab === "assign" && isFinalizeRoute ? (
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
                                        value={assignmentTitle}
                                        onChange={(e) => setAssignmentTitle(e.target.value)}
                                        placeholder="Название задания"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Ученик</label>
                                    <select
                                        className="form-select"
                                        value={selectedStudentId ?? ""}
                                        onChange={(e) =>
                                            setSelectedStudentId(e.target.value ? Number(e.target.value) : null)
                                        }
                                    >
                                        <option value="">Выберите ученика</option>
                                        {options.students.map((student) => (
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
                                    onClick={handleCreateAssignment}
                                    disabled={
                                        isCreatingAssignment || draftTasks.length === 0 || selectedStudentId === null
                                    }
                                >
                                    {isCreatingAssignment ? "Отправляем..." : "Отправить задание"}
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
                                {draftTasks.length === 0 ? (
                                    <div className="text-muted">Нет выбранных задач. Вернитесь на предыдущий шаг.</div>
                                ) : (
                                    <div className="d-flex flex-column gap-4">
                                        {renderedDraftTasks}
                                        {!isDraftInsertionInsideBlock(draftTasks.length) ? (
                                            <div className="text-center">
                                                <AddBlockButton onClick={() => addDraftBlock(draftTasks.length)} />
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {activeTab === "bank" ? (
                <div className="row g-4">
                    <div className={isBankLessonRoute ? "col-12 col-lg-5 col-xl-4" : "col-12"}>
                        <div className="card tasks-card">
                            <div className="card-body">
                                {!isBankLessonRoute ? (
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="mb-0">Банк заданий</h5>
                                    </div>
                                ) : null}
                                {!isBankLessonRoute ? (
                                    <>
                                        {hiddenTaskLessonCards.length > 0 ? (
                                            <div className="d-flex justify-content-end mb-3">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => setShowHiddenLessons((prev) => !prev)}
                                                >
                                                    {showHiddenLessons
                                                        ? `Скрыть скрытые уроки (${hiddenTaskLessonCards.length})`
                                                        : `Показать скрытые уроки (${hiddenTaskLessonCards.length})`}
                                                </button>
                                            </div>
                                        ) : null}
                                        <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-3 g-3">
                                            {visibleTaskLessonCards.map((lessonCard) => (
                                                <div className="col" key={lessonCard.key}>
                                                    <div className="card quizlet-topic-card tasks-lesson-card h-100">
                                                        {lessonCard.lesson_id !== null ? (
                                                            <div className="tasks-lesson-card__actions">
                                                                {confirmHideLessonId === lessonCard.lesson_id ? (
                                                                    <div className="tasks-lesson-card__confirm-actions">
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm btn-danger tasks-lesson-card__confirm-btn"
                                                                            disabled={
                                                                                processingLessonId ===
                                                                                lessonCard.lesson_id
                                                                            }
                                                                            onClick={() =>
                                                                                handleHideLesson(
                                                                                    lessonCard.lesson_id as number,
                                                                                )
                                                                            }
                                                                        >
                                                                            Да
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="tasks-lesson-card__hide-btn"
                                                                            aria-label="Отмена"
                                                                            title="Отмена"
                                                                            onClick={() => setConfirmHideLessonId(null)}
                                                                        >
                                                                            <i className="bi bi-x" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        className="tasks-lesson-card__hide-btn"
                                                                        aria-label="Скрыть урок"
                                                                        title="Скрыть урок"
                                                                        onClick={() =>
                                                                            setConfirmHideLessonId(lessonCard.lesson_id)
                                                                        }
                                                                    >
                                                                        <i className="bi bi-x" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : null}
                                                        <button
                                                            type="button"
                                                            className="tasks-lesson-card__content w-100 text-start"
                                                            onClick={() =>
                                                                navigate(getTaskLessonRoute(lessonCard.lesson_id))
                                                            }
                                                        >
                                                            <div className="card-body d-flex flex-column gap-3 tasks-lesson-card__body">
                                                                <div className="d-flex justify-content-between gap-3 align-items-start">
                                                                    <div>
                                                                        <div className="quizlet-topic-card__title fw-semibold">
                                                                            {lessonCard.title}
                                                                        </div>
                                                                        <div className="quizlet-topic-card__count text-muted mt-1">
                                                                            <i className="bi bi-ui-checks-grid me-1" />
                                                                            {lessonCard.items.length} заданий
                                                                            <span className="mx-2">•</span>
                                                                            <i className="bi bi-distribute-horizontal me-1" />
                                                                            {lessonCard.blocksCount} блоков
                                                                        </div>
                                                                    </div>
                                                                    <div className="tasks-lesson-card__thumb-wrap">
                                                                        {lessonCard.img ? (
                                                                            <img
                                                                                className="tasks-lesson-card__thumb"
                                                                                src={lessonCard.img}
                                                                                alt=""
                                                                            />
                                                                        ) : (
                                                                            <div className="tasks-lesson-card__thumb tasks-lesson-card__thumb--placeholder">
                                                                                <i className="bi bi-image" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {lessonCard.lesson_id === null ? (
                                                                    <div className="small text-muted">
                                                                        задания без урока
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {showHiddenLessons && hiddenTaskLessonCards.length > 0 ? (
                                            <div className="mt-4">
                                                <div className="tasks-group-title">Скрытые уроки</div>
                                                <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-3 g-3">
                                                    {hiddenTaskLessonCards.map((lessonCard) => (
                                                        <div className="col" key={lessonCard.key}>
                                                            <div className="card quizlet-topic-card tasks-lesson-card tasks-lesson-card--hidden h-100">
                                                                <div className="card-body d-flex flex-column gap-3">
                                                                    <div className="d-flex justify-content-between gap-3 align-items-start">
                                                                        <div>
                                                                            <div className="quizlet-topic-card__title fw-semibold">
                                                                                {lessonCard.title}
                                                                            </div>
                                                                            <div className="quizlet-topic-card__count text-muted mt-1">
                                                                                <i className="bi bi-ui-checks-grid me-1" />
                                                                                {lessonCard.items.length} заданий
                                                                            </div>
                                                                        </div>
                                                                        <div className="tasks-lesson-card__thumb-wrap">
                                                                            {lessonCard.img ? (
                                                                                <img
                                                                                    className="tasks-lesson-card__thumb"
                                                                                    src={lessonCard.img}
                                                                                    alt=""
                                                                                />
                                                                            ) : (
                                                                                <div className="tasks-lesson-card__thumb tasks-lesson-card__thumb--placeholder">
                                                                                    <i className="bi bi-image" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="d-flex justify-content-end">
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm btn-outline-primary"
                                                                            disabled={
                                                                                processingLessonId ===
                                                                                lessonCard.lesson_id
                                                                            }
                                                                            onClick={() =>
                                                                                handleShowLesson(
                                                                                    lessonCard.lesson_id as number,
                                                                                )
                                                                            }
                                                                        >
                                                                            Вернуть
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}
                                    </>
                                ) : (
                                    <>
                                        <div className="mb-3">
                                            <TaskBankLessonBreadcrumb lessonName={currentBankLesson?.name} />
                                        </div>
                                        {isCurrentLessonHidden ? (
                                            <div className="alert alert-secondary mt-3 d-flex justify-content-between align-items-center gap-2">
                                                <span>Этот урок скрыт в банке заданий.</span>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary"
                                                    disabled={processingLessonId === currentBankLessonId}
                                                    onClick={() => handleShowLesson(currentBankLessonId as number)}
                                                >
                                                    Вернуть в список
                                                </button>
                                            </div>
                                        ) : null}
                                        <div className="d-flex flex-column gap-3 mt-3">
                                            {filteredBankLessonGroups.map((lessonGroup) => (
                                                <div key={lessonGroup.key}>
                                                    <div className="d-flex flex-column gap-3">
                                                        {groupTaskBankItemsByBlock(lessonGroup.items).map((group) => (
                                                            <div key={group.key}>
                                                                <div className="small fw-semibold text-secondary mb-2">
                                                                    {group.title}
                                                                </div>
                                                                <div className="d-flex flex-column gap-3">
                                                                    {group.items.map((item) => (
                                                                        <button
                                                                            type="button"
                                                                            key={item.id}
                                                                            className="tasks-bank-lesson-item border rounded p-3 bg-white text-start"
                                                                            onClick={() =>
                                                                                setEditor({
                                                                                    id: item.id,
                                                                                    title: item.title,
                                                                                    lesson_id: item.lesson_id,
                                                                                    task: item.task,
                                                                                })
                                                                            }
                                                                        >
                                                                            <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                                                                                <div>
                                                                                    <div className="fw-semibold">
                                                                                        {item.title}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="d-flex gap-2">
                                                                                    <button
                                                                                        type="button"
                                                                                        className="tasks-delete-icon-btn"
                                                                                        aria-label="Удалить"
                                                                                        title="Удалить"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleDeleteBankItem(
                                                                                                item.id,
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        <i className="bi bi-x-lg" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                            <div className="small text-muted">
                                                                                {
                                                                                    assessmentTaskRusNameAliases[
                                                                                        item.task.name
                                                                                    ]
                                                                                }
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                            {filteredBankItems.length === 0 ? (
                                                <div className="text-muted">Для этого урока заданий пока нет.</div>
                                            ) : null}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    {isBankLessonRoute ? (
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
                                        <>
                                            <div className="tasks-editor-meta-row">
                                                <div className="tasks-editor-title-field">
                                                    <label className="form-label">Название</label>
                                                    <input
                                                        className="form-control"
                                                        value={editor.title}
                                                        onChange={(e) =>
                                                            setEditor((prev) =>
                                                                prev === null
                                                                    ? prev
                                                                    : { ...prev, title: e.target.value },
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="tasks-editor-lesson-field">
                                                    <label className="form-label">Урок</label>
                                                    <select
                                                        className="form-select"
                                                        value={editor.lesson_id ?? ""}
                                                        onChange={(e) =>
                                                            setEditor((prev) =>
                                                                prev === null
                                                                    ? prev
                                                                    : {
                                                                          ...prev,
                                                                          lesson_id: e.target.value
                                                                              ? Number(e.target.value)
                                                                              : null,
                                                                      },
                                                            )
                                                        }
                                                    >
                                                        <option value="">Нерассортированное</option>
                                                        {options.lessons.map((lesson) => (
                                                            <option key={lesson.id} value={lesson.id}>
                                                                {lesson.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="tasks-editor-surface">
                                                <div className="tasks-editor-title">
                                                    {assessmentTaskRusNameAliases[editor.task.name]}
                                                </div>
                                                {drawTeacherItem(editor.task, (task) =>
                                                    setEditor((prev) => (prev === null ? prev : { ...prev, task })),
                                                )}
                                            </div>
                                            <div className="d-flex gap-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-success"
                                                    onClick={handleSaveBankItem}
                                                    disabled={isSavingBankItem}
                                                >
                                                    {isSavingBankItem
                                                        ? "Сохраняем..."
                                                        : editor.id === undefined
                                                          ? "Создать"
                                                          : "Сохранить"}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => setEditor(null)}
                                                >
                                                    Отмена
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}

            {activeTab === "history" ? (
                <div className="d-flex flex-column gap-3">
                    {assignments.length === 0 ? <div className="text-muted">Пока нет назначенных заданий</div> : null}
                    <div className="quizlet-assignment-list tasks-history-list">
                        {visibleAssignments.map((item) => {
                            const taskTypeLabels = getHomeworkAssignmentTypeLabels(item.tasks);
                            const lessonLabels = getHomeworkAssignmentLessonLabels(item.tasks, options.lessons);

                            return (
                                <div
                                    key={item.assignment.id}
                                    className="card quizlet-assignment-card tasks-history-card"
                                >
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
                                            <div
                                                className={`quizlet-assignment-card__status ${item.stats.pending === 0 && item.stats.cancelled === 0 ? "quizlet-assignment-card__status--emoji" : item.stats.pending > 0 && item.stats.cancelled === 0 ? "quizlet-assignment-card__status--emoji" : ""}`}
                                                title={
                                                    item.stats.pending === 0
                                                        ? item.stats.cancelled > 0
                                                            ? "Есть отмененные назначения"
                                                            : "Задание выполнено"
                                                        : "Задание ожидает выполнения"
                                                }
                                            >
                                                {item.stats.pending === 0 && item.stats.cancelled === 0 ? (
                                                    <span
                                                        className="quizlet-assignment-card__status-emoji"
                                                        role="img"
                                                        aria-label="Задание выполнено"
                                                    >
                                                        🎋
                                                    </span>
                                                ) : item.stats.cancelled > 0 ? (
                                                    <i
                                                        className="bi bi-dash-circle-fill fs-4 text-secondary"
                                                        aria-hidden="true"
                                                    />
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
                                                                {target.result ? (
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-outline-primary"
                                                                        onClick={() =>
                                                                            navigate(`/tasks/tries/${target.result.id}`)
                                                                        }
                                                                    >
                                                                        Результат
                                                                    </button>
                                                                ) : null}
                                                                {target.status === "pending" ? (
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm quizlet-assignment-cancel-btn"
                                                                        onClick={() => handleCancelTarget(target.id)}
                                                                        disabled={cancellingTargetIds.includes(
                                                                            target.id,
                                                                        )}
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
                    {hasMoreAssignments ? (
                        <div className="d-flex justify-content-center">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => setVisibleHistoryCount((prev) => prev + HISTORY_PAGE_SIZE)}
                            >
                                Показать еще 10
                            </button>
                        </div>
                    ) : null}
                </div>
            ) : null}

            <SelectTypeModal isShow={showTypeModal} close={() => setShowTypeModal(false)} addTasks={openCreateEditor} />
        </div>
    );
};

export default TeacherTasksManager;
