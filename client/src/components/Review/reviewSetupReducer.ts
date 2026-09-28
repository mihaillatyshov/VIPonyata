import { REVIEW_RANDOM_SESSION_SIZES, ReviewTrainingMode, TrainingSession } from "./reviewTraining";

export type ReviewRandomSessionSize = (typeof REVIEW_RANDOM_SESSION_SIZES)[number];

/** Настройки тренировки; живут, пока открыт раздел, и переживают переходы между вкладками. */
export interface ReviewSetupState {
    mode: ReviewTrainingMode;
    randomCount: ReviewRandomSessionSize;
    direction: TrainingSession["direction"];
    speakJpAfterFlip: boolean;
    autoSpeakCards: boolean;
    selectedTopicIds: number[];
}

export type ReviewSetupAction =
    | { type: "setMode"; mode: ReviewTrainingMode }
    | { type: "setRandomCount"; count: ReviewRandomSessionSize }
    | { type: "setDirection"; direction: TrainingSession["direction"] }
    | { type: "setSpeakJpAfterFlip"; enabled: boolean }
    | { type: "setAutoSpeakCards"; enabled: boolean }
    | { type: "toggleTopic"; topicId: number }
    /** Выбрать все топики словаря или снять выбор, если выбраны все. */
    | { type: "toggleDictionaryTopics"; topicIds: number[] };

export const initialReviewSetupState: ReviewSetupState = {
    mode: "topics",
    randomCount: 50,
    direction: "jp_to_ru",
    speakJpAfterFlip: false,
    autoSpeakCards: false,
    selectedTopicIds: [],
};

export const reviewSetupReducer = (state: ReviewSetupState, action: ReviewSetupAction): ReviewSetupState => {
    switch (action.type) {
        case "setMode":
            return { ...state, mode: action.mode };
        case "setRandomCount":
            return { ...state, randomCount: action.count };
        case "setDirection":
            return { ...state, direction: action.direction };
        // Два режима озвучки взаимоисключающие.
        case "setSpeakJpAfterFlip":
            return {
                ...state,
                speakJpAfterFlip: action.enabled,
                autoSpeakCards: action.enabled ? false : state.autoSpeakCards,
            };
        case "setAutoSpeakCards":
            return {
                ...state,
                autoSpeakCards: action.enabled,
                speakJpAfterFlip: action.enabled ? false : state.speakJpAfterFlip,
            };
        case "toggleTopic":
            return {
                ...state,
                selectedTopicIds: state.selectedTopicIds.includes(action.topicId)
                    ? state.selectedTopicIds.filter((item) => item !== action.topicId)
                    : [...state.selectedTopicIds, action.topicId],
            };
        case "toggleDictionaryTopics": {
            if (action.topicIds.length === 0) {
                return state;
            }
            const allSelected = action.topicIds.every((topicId) => state.selectedTopicIds.includes(topicId));
            return {
                ...state,
                selectedTopicIds: allSelected
                    ? state.selectedTopicIds.filter((topicId) => !action.topicIds.includes(topicId))
                    : [...new Set([...state.selectedTopicIds, ...action.topicIds])],
            };
        }
    }
};
