export interface AssignmentFormState {
    title: string;
    quizType: "pair" | "flashcards";
    showHints: boolean;
    direction: "jp_to_ru" | "ru_to_jp";
    subgroupIds: number[];
    studentIds: number[];
    /** Выбранные темы личных словарей по id ученика. */
    personalSubgroupIdsByStudent: Record<number, number[]>;
    expandedGroupIds: number[];
}

export type AssignmentFormAction =
    | { type: "setTitle"; title: string }
    | { type: "setQuizType"; quizType: AssignmentFormState["quizType"] }
    | { type: "setShowHints"; showHints: boolean }
    | { type: "setDirection"; direction: AssignmentFormState["direction"] }
    | { type: "toggleSubgroup"; subgroupId: number }
    /** Выбрать все темы урока или снять выбор, если выбраны все. */
    | { type: "toggleGroupSubgroups"; subgroupIds: number[] }
    | { type: "toggleGroupExpanded"; groupId: number }
    | { type: "setExpandedGroups"; groupIds: number[] }
    | { type: "toggleStudent"; studentId: number }
    | { type: "togglePersonalSubgroup"; studentId: number; subgroupId: number }
    | { type: "resetAfterCreate" };

export const initialAssignmentFormState: AssignmentFormState = {
    title: "",
    quizType: "flashcards",
    showHints: false,
    direction: "jp_to_ru",
    subgroupIds: [],
    studentIds: [],
    personalSubgroupIdsByStudent: {},
    expandedGroupIds: [],
};

const toggleId = (ids: number[], id: number) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);

export const assignmentFormReducer = (
    state: AssignmentFormState,
    action: AssignmentFormAction,
): AssignmentFormState => {
    switch (action.type) {
        case "setTitle":
            return { ...state, title: action.title };
        case "setQuizType":
            return { ...state, quizType: action.quizType };
        case "setShowHints":
            return { ...state, showHints: action.showHints };
        case "setDirection":
            return { ...state, direction: action.direction };
        case "toggleSubgroup":
            return { ...state, subgroupIds: toggleId(state.subgroupIds, action.subgroupId) };
        case "toggleGroupSubgroups": {
            const allSelected =
                action.subgroupIds.length > 0 && action.subgroupIds.every((id) => state.subgroupIds.includes(id));
            return {
                ...state,
                subgroupIds: allSelected
                    ? state.subgroupIds.filter((id) => !action.subgroupIds.includes(id))
                    : Array.from(new Set([...state.subgroupIds, ...action.subgroupIds])),
            };
        }
        case "toggleGroupExpanded":
            return { ...state, expandedGroupIds: toggleId(state.expandedGroupIds, action.groupId) };
        case "setExpandedGroups":
            return { ...state, expandedGroupIds: action.groupIds };
        case "toggleStudent": {
            const studentIds = toggleId(state.studentIds, action.studentId);
            // Выбор тем личного словаря снятого ученика больше не нужен.
            const personalSubgroupIdsByStudent = Object.fromEntries(
                Object.entries(state.personalSubgroupIdsByStudent).filter(([studentId]) =>
                    studentIds.includes(Number(studentId)),
                ),
            );
            return { ...state, studentIds, personalSubgroupIdsByStudent };
        }
        case "togglePersonalSubgroup":
            return {
                ...state,
                personalSubgroupIdsByStudent: {
                    ...state.personalSubgroupIdsByStudent,
                    [action.studentId]: toggleId(
                        state.personalSubgroupIdsByStudent[action.studentId] ?? [],
                        action.subgroupId,
                    ),
                },
            };
        case "resetAfterCreate":
            return { ...state, title: "", subgroupIds: [], studentIds: [], personalSubgroupIdsByStudent: {} };
    }
};
