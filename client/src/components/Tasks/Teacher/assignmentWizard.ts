import { swapElements } from "libs/swapArrayElements";
import { TAssessmentTaskName, TTeacherAssessmentAnyItem } from "models/Activity/Items/TAssessmentItems";

import { AssignmentDraftTask, createDraftBlockBoundaryTask, findLastIndex } from "./tasksUtils";

/** Мастер назначения: шаг 1 — ученик, уроки и задания; шаг 2 (/tasks/finalize) — редактирование черновика. */
export interface AssignmentWizardState {
    title: string;
    studentId: number | null;
    lessonIds: number[];
    taskIds: number[];
    previewTaskId: number | null;
    draftTasks: AssignmentDraftTask[];
}

export type AssignmentWizardAction =
    | { type: "setTitle"; title: string }
    | { type: "setStudent"; studentId: number | null }
    | { type: "toggleStudent"; studentId: number }
    | { type: "toggleLesson"; lessonId: number }
    | { type: "toggleTask"; taskId: number }
    | { type: "setPreview"; taskId: number }
    | { type: "startFinalize"; draftTasks: AssignmentDraftTask[] }
    | { type: "addDraftBlock"; index: number }
    | { type: "moveDraftTask"; index: number; direction: "up" | "down" }
    | { type: "changeDraftTask"; index: number; task: TTeacherAssessmentAnyItem }
    | { type: "changeDraftTitle"; index: number; title: string }
    | { type: "removeDraftTask"; index: number }
    | { type: "resetAfterCreate" };

export const initialAssignmentWizardState: AssignmentWizardState = {
    title: "",
    studentId: null,
    lessonIds: [],
    taskIds: [],
    previewTaskId: null,
    draftTasks: [],
};

export const DEFAULT_HOMEWORK_TITLE = "Домашнее задание";

const toggleId = (ids: number[], id: number) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);

const isBlockBoundary = (item: AssignmentDraftTask) =>
    item.task.name === TAssessmentTaskName.BLOCK_BEGIN || item.task.name === TAssessmentTaskName.BLOCK_END;

/** Позиция вставки внутри открытого блока (блоки не вкладываются). */
export const isDraftInsertionInsideBlock = (draftTasks: AssignmentDraftTask[], insertionIndex: number) => {
    let depth = 0;

    for (let i = 0; i < insertionIndex; i++) {
        if (draftTasks[i].task.name === TAssessmentTaskName.BLOCK_BEGIN) {
            depth++;
        } else if (draftTasks[i].task.name === TAssessmentTaskName.BLOCK_END) {
            depth = Math.max(0, depth - 1);
        }
    }

    return depth > 0;
};

/** Начала и концы блоков должны чередоваться парами. */
export const isDraftBlocksStructureValid = (draftTasks: AssignmentDraftTask[]) => {
    const blocks = draftTasks.filter(isBlockBoundary);

    if (blocks.length % 2 !== 0) {
        return false;
    }

    return blocks.every((block, index) => index === 0 || block.task.name !== blocks[index - 1].task.name);
};

/** Удаляет задание; у границы блока удаляется и парная граница. */
const removeDraftTask = (draftTasks: AssignmentDraftTask[], index: number) => {
    const next = [...draftTasks];
    const taskName = next[index]?.task.name;

    if (taskName === undefined) {
        return draftTasks;
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
};

const updateDraftAt = (
    draftTasks: AssignmentDraftTask[],
    index: number,
    update: Partial<Pick<AssignmentDraftTask, "task" | "title">>,
) => draftTasks.map((item, itemIndex) => (itemIndex === index ? { ...item, ...update } : item));

export const assignmentWizardReducer = (
    state: AssignmentWizardState,
    action: AssignmentWizardAction,
): AssignmentWizardState => {
    switch (action.type) {
        case "setTitle":
            return { ...state, title: action.title };
        case "setStudent":
            return { ...state, studentId: action.studentId };
        case "toggleStudent":
            return { ...state, studentId: state.studentId === action.studentId ? null : action.studentId };
        case "toggleLesson":
            return { ...state, lessonIds: toggleId(state.lessonIds, action.lessonId) };
        case "toggleTask":
            return { ...state, taskIds: toggleId(state.taskIds, action.taskId) };
        case "setPreview":
            return { ...state, previewTaskId: action.taskId };
        case "startFinalize":
            return {
                ...state,
                title: state.title.trim() === "" ? DEFAULT_HOMEWORK_TITLE : state.title,
                draftTasks: action.draftTasks,
            };
        case "addDraftBlock": {
            if (isDraftInsertionInsideBlock(state.draftTasks, action.index)) {
                return state;
            }
            const draftTasks = [...state.draftTasks];
            draftTasks.splice(
                action.index,
                0,
                createDraftBlockBoundaryTask(TAssessmentTaskName.BLOCK_BEGIN),
                createDraftBlockBoundaryTask(TAssessmentTaskName.BLOCK_END),
            );
            return { ...state, draftTasks };
        }
        case "moveDraftTask": {
            const targetIndex = action.index + (action.direction === "up" ? -1 : 1);
            if (targetIndex < 0 || targetIndex >= state.draftTasks.length) {
                return state;
            }
            const draftTasks = [...state.draftTasks];
            swapElements(draftTasks, action.index, targetIndex);
            return { ...state, draftTasks };
        }
        case "changeDraftTask":
            return { ...state, draftTasks: updateDraftAt(state.draftTasks, action.index, { task: action.task }) };
        case "changeDraftTitle":
            return { ...state, draftTasks: updateDraftAt(state.draftTasks, action.index, { title: action.title }) };
        case "removeDraftTask":
            return { ...state, draftTasks: removeDraftTask(state.draftTasks, action.index) };
        case "resetAfterCreate":
            return { ...state, title: "", taskIds: [], draftTasks: [] };
    }
};
