import { TUserData } from "./TUser";

export type TTeacherHistoryStatus = "completed" | "started";
export type TTeacherHistoryTrainingKind = "quizlet" | "test" | "practice" | "dictionary";

export interface TTeacherHistoryEvent {
    id: string;
    event_type: string;
    action_type: string;
    action_label: string;
    status: TTeacherHistoryStatus;
    created_at: string;
    started_at?: string | null;
    completed_at?: string | null;
    elapsed_seconds?: number | null;
    mistakes_count?: number | null;
    correct_answers?: number | null;
    skipped_words?: number | null;
    training_kind: TTeacherHistoryTrainingKind;
    target_name: string;
    target_url?: string | null;
    student: TUserData;
    quiz_type?: string;
    translation_direction?: "jp_to_ru" | "ru_to_jp" | string;
    total_words?: number | null;
    topic_titles?: string[];
    is_assignment?: boolean;
}

export interface TTeacherHistoryResponse {
    students: TUserData[];
    history: TTeacherHistoryEvent[];
}
