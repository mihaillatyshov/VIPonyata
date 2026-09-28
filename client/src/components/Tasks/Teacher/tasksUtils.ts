import { THomeworkTargetStatus, TTasksLessonOption } from "api/tasks";
import { uuid } from "libs/uuid";
import {
    assessmentTaskRusNameAliases,
    getTeacherAssessmentTaskDefaultData,
    TAssessmentTaskName,
    TTeacherAssessmentAnyItem,
} from "models/Activity/Items/TAssessmentItems";
import { THomeworkAssignmentTask, TTaskBankItem } from "models/TTasks";

export interface TaskBlockGroup {
    key: string;
    title: string;
    items: TTaskBankItem[];
}

export interface TaskLessonGroup {
    key: string;
    title: string;
    items: TTaskBankItem[];
}

export interface TaskLessonCardItem {
    key: string;
    title: string;
    lesson_id: number | null;
    img?: string | null;
    items: TTaskBankItem[];
    blocksCount: number;
    isHidden: boolean;
}

export interface AssignmentDraftTask {
    client_id: string;
    task_bank_item_id: number | null;
    lesson_id: number | null;
    title: string;
    task: TTeacherAssessmentAnyItem;
}

export function findLastIndex<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => boolean): number {
    let length = array.length;
    while (length--) {
        if (predicate(array[length], length, array)) {
            return length;
        }
    }

    return -1;
}

export const formatDateTime = (value: string | null) => {
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

export const getHomeworkTargetStatusLabel = (status: THomeworkTargetStatus) => {
    if (status === "completed") {
        return { text: "Выполнено", className: "text-success" };
    }

    if (status === "cancelled") {
        return { text: "Отменено", className: "text-muted" };
    }

    return { text: "Ожидает", className: "text-secondary" };
};

export const getHomeworkAssignmentTypeLabels = (tasks: THomeworkAssignmentTask[]) => [
    ...new Set(tasks.map((task) => assessmentTaskRusNameAliases[task.task.name])),
];

export const getHomeworkAssignmentLessonLabels = (tasks: THomeworkAssignmentTask[], lessons: TTasksLessonOption[]) => [
    ...new Set(
        tasks
            .map((task) => lessons.find((lesson) => lesson.id === task.lesson_id)?.name ?? null)
            .filter((lessonName): lessonName is string => lessonName !== null),
    ),
];

export const getTaskBlockTitle = (item: TTaskBankItem) => {
    if (item.source_block_index === null || item.source_block_index === undefined) {
        return "Без блока";
    }

    return `Блок ${item.source_block_index}`;
};

export const groupTaskBankItemsByBlock = (items: TTaskBankItem[]) => {
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

export const groupTaskBankItemsByLesson = (items: TTaskBankItem[], lessons: TTasksLessonOption[]) => {
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

export const getTaskLessonRoute = (lessonId: number | null) =>
    lessonId === null ? "/tasks/bank/lessons/unsorted" : `/tasks/bank/lessons/${lessonId}`;

export const buildTaskLessonCards = (
    items: TTaskBankItem[],
    lessons: TTasksLessonOption[],
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

export const createDraftTaskFromBankItem = (item: TTaskBankItem): AssignmentDraftTask => ({
    client_id: uuid(),
    task_bank_item_id: item.id,
    lesson_id: item.lesson_id,
    title: item.title,
    task: JSON.parse(JSON.stringify(item.task)) as TTeacherAssessmentAnyItem,
});

export const createDraftBlockBoundaryTask = (
    taskName: TAssessmentTaskName.BLOCK_BEGIN | TAssessmentTaskName.BLOCK_END,
) => ({
    client_id: uuid(),
    task_bank_item_id: null,
    lesson_id: null,
    title: assessmentTaskRusNameAliases[taskName],
    task: getTeacherAssessmentTaskDefaultData(taskName),
});

export const buildDraftTasksFromSelection = (items: TTaskBankItem[]): AssignmentDraftTask[] => {
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
