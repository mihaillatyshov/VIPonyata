export interface TQuizletGroup {
    id: number;
    title: string;
    sort: number;
    created_at: string;
}

export interface TQuizletSubgroup {
    id: number;
    title: string;
    sort: number;
    group_id?: number;
    lesson_id?: number;
    created_at: string;
}

export interface TQuizletWord {
    id: number;
    char_jp: string | null;
    word_jp: string;
    ru: string;
    img: string | null;
    owner_id?: number | null;
    subgroup_id?: number;
    created_at: string;
}

export interface TQuizletSubgroupWord {
    subgroup_id: number;
    word_id: number;
}

export interface TQuizletLesson {
    id: number;
    title: string;
    user_id: number;
    created_at: string;
}

export interface TQuizletSession {
    id: number;
    quiz_type: "pair" | "flashcards";
    show_hints: boolean;
    translation_direction: "jp_to_ru" | "ru_to_jp";
    is_finished: boolean;
    started_at: string;
    updated_at: string;
    ended_at: string | null;
    elapsed_seconds: number;
    total_words: number;
    correct_answers: number;
    incorrect_answers: number;
    skipped_words: number;
    user_id: number;
    assignment_id?: number | null;
}

export interface TQuizletSessionWord {
    id: number;
    source_type: string;
    source_word_id: number;
    char_jp: string | null;
    word_jp: string;
    ru: string;
    img: string | null;
    is_correct: boolean;
    is_skipped: boolean;
    incorrect_attempts: number;
    correct_attempts: number;
    session_id: number;
}

export interface TQuizletAssignment {
    id: number;
    title: string;
    quiz_type: "pair" | "flashcards";
    show_hints: boolean;
    translation_direction: "jp_to_ru" | "ru_to_jp";
    max_words: number;
    created_at: string;
    created_by_id: number;
}

export interface TQuizletAssignmentTarget {
    id: number;
    status: "pending" | "completed";
    assigned_at: string;
    completed_at: string | null;
}

export interface TQuizletAssignmentResult {
    id: number;
    assignment_id: number;
    student_id: number;
    session_id: number;
    completed_at: string;
    total_words: number;
    correct_answers: number;
    incorrect_answers: number;
    skipped_words: number;
    elapsed_seconds: number;
}
