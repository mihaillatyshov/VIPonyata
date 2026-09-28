import { AjaxDelete, AjaxGet, AjaxPatch, AjaxPost } from "libs/ServerAPI";
import {
    TQuizletAssignment,
    TQuizletAssignmentResult,
    TQuizletAssignmentTarget,
    TQuizletGroup,
    TQuizletLesson,
    TQuizletSession,
    TQuizletSessionWord,
    TQuizletSubgroup,
    TQuizletSubgroupWord,
    TQuizletWord,
} from "models/TQuizlet";

import { queryOptions } from "@tanstack/react-query";

// ---------- Типы ответов ----------

export interface TQuizletCatalog {
    groups: TQuizletGroup[];
    subgroups: TQuizletSubgroup[];
    subgroup_words: TQuizletSubgroupWord[];
    words: TQuizletWord[];
}

/** Личный словарь ученика (свой — `/personal`, чужой для учителя — `/students-dictionaries/:id`). */
export interface TQuizletPersonalDictionary {
    lesson: TQuizletLesson | null;
    subgroups: TQuizletSubgroup[];
    words: TQuizletWord[];
}

export type TQuizletSessionWithQueue = TQuizletSession & { queue_state?: string };

export interface TQuizletSessionDetails {
    session: TQuizletSessionWithQueue;
    words: TQuizletSessionWord[];
}

export interface TQuizletStartSessionPayload {
    quiz_type: "pair" | "flashcards";
    subgroup_ids: number[];
    user_subgroup_ids: number[];
    show_hints: boolean;
    translation_direction: "jp_to_ru" | "ru_to_jp";
    max_words: number;
}

export interface TQuizletStudentOption {
    id: number;
    name: string;
    nickname: string;
}

export interface TQuizletAssignmentListItem {
    assignment: TQuizletAssignment;
    subgroups: TQuizletSubgroup[];
    targets: Array<{
        id: number;
        student: TQuizletStudentOption | null;
        personal_subgroups: TQuizletSubgroup[];
        status: TQuizletAssignmentTarget["status"];
        assigned_at: string;
        completed_at: string | null;
        result: TQuizletAssignmentResult | null;
    }>;
    stats: {
        total: number;
        completed: number;
        pending: number;
        cancelled: number;
    };
}

export interface TQuizletCreateAssignmentPayload {
    title: string;
    quiz_type: "pair" | "flashcards";
    subgroup_ids: number[];
    personal_targets: Array<{ student_id: number; subgroup_ids: number[] }>;
    show_hints: boolean;
    translation_direction: "jp_to_ru" | "ru_to_jp";
    student_ids: number[];
}

export interface TQuizletStudentCard {
    id: number;
    name: string;
    nickname: string;
    has_personal_dictionary: boolean;
    is_hidden: boolean;
}

/** Слово без id — для создания/обновления. */
export interface TQuizletWordFields {
    char_jp: string | null;
    word_jp: string;
    ru: string;
}

// ---------- Ключи кеша ----------

export const quizletKeys = {
    all: ["quizlet"] as const,
    catalog: () => [...quizletKeys.all, "catalog"] as const,
    personal: () => [...quizletKeys.all, "personal"] as const,
    sessions: () => [...quizletKeys.all, "sessions"] as const,
    sessionStats: () => [...quizletKeys.sessions(), "stats"] as const,
    activeSession: () => [...quizletKeys.sessions(), "active"] as const,
    session: (sessionId: number) => [...quizletKeys.sessions(), "details", sessionId] as const,
    assignmentOptions: () => [...quizletKeys.all, "assignments", "options"] as const,
    assignments: () => [...quizletKeys.all, "assignments", "list"] as const,
    studentsDictionaries: () => [...quizletKeys.all, "students-dictionaries"] as const,
    studentsList: () => [...quizletKeys.studentsDictionaries(), "list"] as const,
    studentDictionary: (studentId: number) => [...quizletKeys.studentsDictionaries(), "student", studentId] as const,
};

// ---------- Общие ----------

export const quizletQueries = {
    catalog: () =>
        queryOptions({
            queryKey: quizletKeys.catalog(),
            queryFn: ({ signal }) => AjaxGet<TQuizletCatalog>({ url: "/api/quizlet/groups", signal }),
        }),
    personal: () =>
        queryOptions({
            queryKey: quizletKeys.personal(),
            queryFn: ({ signal }) => AjaxGet<TQuizletPersonalDictionary>({ url: "/api/quizlet/personal", signal }),
        }),
    sessionStats: () =>
        queryOptions({
            queryKey: quizletKeys.sessionStats(),
            queryFn: ({ signal }) =>
                AjaxGet<{ sessions: TQuizletSession[] }>({ url: "/api/quizlet/sessions/stats", signal }),
        }),
    activeSession: () =>
        queryOptions({
            queryKey: quizletKeys.activeSession(),
            queryFn: async ({ signal }) => {
                try {
                    const json = await AjaxGet<{ session: TQuizletSessionWithQueue | null }>({
                        url: "/api/quizlet/sessions/active",
                        signal,
                    });
                    return json.session;
                } catch {
                    // Запасной вариант для сервера без эндпоинта /sessions/active.
                    const json = await AjaxGet<{ sessions: TQuizletSession[] }>({
                        url: "/api/quizlet/sessions/stats",
                        signal,
                    });
                    return json.sessions.find((item) => !item.is_finished) ?? null;
                }
            },
        }),
    session: (sessionId: number) =>
        queryOptions({
            queryKey: quizletKeys.session(sessionId),
            queryFn: ({ signal }) =>
                AjaxGet<TQuizletSessionDetails>({ url: `/api/quizlet/sessions/${sessionId}`, signal }),
        }),
    assignmentOptions: () =>
        queryOptions({
            queryKey: quizletKeys.assignmentOptions(),
            queryFn: ({ signal }) =>
                AjaxGet<{ students: TQuizletStudentOption[] }>({ url: "/api/quizlet/assignments/options", signal }),
        }),
    assignments: () =>
        queryOptions({
            queryKey: quizletKeys.assignments(),
            queryFn: ({ signal }) =>
                AjaxGet<{ assignments: TQuizletAssignmentListItem[] }>({ url: "/api/quizlet/assignments", signal }),
        }),
    studentsList: () =>
        queryOptions({
            queryKey: quizletKeys.studentsList(),
            queryFn: ({ signal }) =>
                AjaxGet<{ students: TQuizletStudentCard[] }>({ url: "/api/quizlet/students-dictionaries", signal }),
        }),
    studentDictionary: (studentId: number) =>
        queryOptions({
            queryKey: quizletKeys.studentDictionary(studentId),
            queryFn: ({ signal }) =>
                AjaxGet<TQuizletPersonalDictionary>({ url: `/api/quizlet/students-dictionaries/${studentId}`, signal }),
        }),
};

// ---------- Ученик: личный словарь ----------

export const saveQuizletPersonalLesson = (title: string, isNew: boolean) =>
    (isNew ? AjaxPost : AjaxPatch)({ url: "/api/quizlet/personal", body: { title } });

export const createQuizletPersonalSubgroup = (title: string) =>
    AjaxPost<{ subgroup: TQuizletSubgroup }>({ url: "/api/quizlet/personal/subgroups", body: { title } });

export const renameQuizletPersonalSubgroup = (subgroupId: number, title: string) =>
    AjaxPatch({ url: `/api/quizlet/personal/subgroups/${subgroupId}`, body: { title } });

export const deleteQuizletPersonalSubgroup = (subgroupId: number) =>
    AjaxDelete({ url: `/api/quizlet/personal/subgroups/${subgroupId}` });

export const createQuizletPersonalWord = (subgroupId: number, word: TQuizletWordFields) =>
    AjaxPost<{ word: TQuizletWord }>({
        url: "/api/quizlet/personal/words",
        body: { subgroup_id: subgroupId, ...word },
    });

export const updateQuizletPersonalWord = (wordId: number, word: TQuizletWordFields) =>
    AjaxPatch({ url: `/api/quizlet/personal/words/${wordId}`, body: word });

export const deleteQuizletPersonalWord = (wordId: number) =>
    AjaxDelete({ url: `/api/quizlet/personal/words/${wordId}` });

// ---------- Ученик: тренировки ----------

export const startQuizletSession = (payload: TQuizletStartSessionPayload) =>
    AjaxPost<{ session: TQuizletSession }>({ url: "/api/quizlet/sessions/start", body: payload });

export const startQuizletAssignmentSession = (assignmentId: number) =>
    AjaxPost<{ session: TQuizletSession }>({ url: `/api/quizlet/assignments/${assignmentId}/start`, body: {} });

export const endQuizletSession = (sessionId: number, forceFinish: boolean) =>
    AjaxPost<{ session: TQuizletSession }>({
        url: `/api/quizlet/sessions/${sessionId}/end`,
        body: { force_finish: forceFinish },
    });

export const retryQuizletSession = (sourceSessionId: number, onlyIncorrect: boolean) =>
    AjaxPost<{ session: TQuizletSession }>({
        url: onlyIncorrect ? "/api/quizlet/sessions/retry-incorrect" : "/api/quizlet/sessions/retry-all",
        body: { source_session_id: sourceSessionId },
    });

export const submitQuizletPairAttempt = (sessionId: number, leftWordId: number, rightWordId: number) =>
    AjaxPost<{ is_correct: boolean }>({
        url: `/api/quizlet/sessions/${sessionId}/pair-attempt`,
        body: { left_word_id: leftWordId, right_word_id: rightWordId },
    });

export const submitQuizletFlashcardAnswer = (sessionId: number, sessionWordId: number, recognized: boolean) =>
    AjaxPost({
        url: `/api/quizlet/sessions/${sessionId}/flashcard-answer`,
        body: { session_word_id: sessionWordId, recognized },
    });

export const markQuizletFlashcardViewed = (sessionId: number, sessionWordId: number) =>
    AjaxPost({ url: `/api/quizlet/sessions/${sessionId}/flashcard-viewed`, body: { session_word_id: sessionWordId } });

export const saveQuizletSessionProgress = (sessionId: number, queue: number[]) =>
    AjaxPost({ url: `/api/quizlet/sessions/${sessionId}/save-progress`, body: { queue } });

// ---------- Учитель: словари ----------

export const createQuizletGroup = (title: string, sort: number) =>
    AjaxPost<{ group: TQuizletGroup }>({ url: "/api/quizlet/groups", body: { title, sort } });

export const updateQuizletGroup = (groupId: number, title: string, sort: number) =>
    AjaxPatch({ url: `/api/quizlet/groups/${groupId}`, body: { title, sort } });

export const deleteQuizletGroup = (groupId: number) => AjaxDelete({ url: `/api/quizlet/groups/${groupId}` });

export const createQuizletSubgroup = (groupId: number, title: string, sort: number) =>
    AjaxPost<{ subgroup: TQuizletSubgroup }>({
        url: `/api/quizlet/groups/${groupId}/subgroups`,
        body: { title, sort },
    });

export const updateQuizletSubgroup = (subgroupId: number, title: string, sort: number) =>
    AjaxPatch({ url: `/api/quizlet/subgroups/${subgroupId}`, body: { title, sort } });

export const deleteQuizletSubgroup = (subgroupId: number) =>
    AjaxDelete({ url: `/api/quizlet/subgroups/${subgroupId}` });

export const createQuizletWordsBatch = (words: Array<TQuizletWordFields & { subgroup_id: number }>) =>
    AjaxPost<{ words: TQuizletWord[] }>({ url: "/api/quizlet/words/batch", body: { words } });

export const updateQuizletWord = (wordId: number, word: TQuizletWordFields) =>
    AjaxPatch({ url: `/api/quizlet/words/${wordId}`, body: word });

export const removeQuizletWordFromSubgroup = (subgroupId: number, wordId: number) =>
    AjaxDelete({ url: `/api/quizlet/subgroups/${subgroupId}/words/${wordId}` });

// ---------- Учитель: задания ----------

export const createQuizletAssignment = (payload: TQuizletCreateAssignmentPayload) =>
    AjaxPost({ url: "/api/quizlet/assignments", body: payload });

export const cancelQuizletAssignmentTarget = (targetId: number) =>
    AjaxDelete({ url: `/api/quizlet/assignment-targets/${targetId}` });

// ---------- Учитель: словари учеников ----------

export const saveQuizletStudentLesson = (studentId: number, title: string, isNew: boolean) =>
    (isNew ? AjaxPost : AjaxPatch)({ url: `/api/quizlet/students-dictionaries/${studentId}/lesson`, body: { title } });

export const createQuizletStudentSubgroup = (studentId: number, title: string) =>
    AjaxPost<{ subgroup: TQuizletSubgroup }>({
        url: `/api/quizlet/students-dictionaries/${studentId}/subgroups`,
        body: { title },
    });

export const renameQuizletStudentSubgroup = (studentId: number, subgroupId: number, title: string) =>
    AjaxPatch({ url: `/api/quizlet/students-dictionaries/${studentId}/subgroups/${subgroupId}`, body: { title } });

export const deleteQuizletStudentSubgroup = (studentId: number, subgroupId: number) =>
    AjaxDelete({ url: `/api/quizlet/students-dictionaries/${studentId}/subgroups/${subgroupId}` });

export const saveQuizletStudentWordsBatch = (
    studentId: number,
    subgroupId: number,
    changes: {
        deleted_ids: number[];
        created: Array<TQuizletWordFields & { subgroup_id: number }>;
        updated: Array<TQuizletWordFields & { id: number }>;
    },
) =>
    AjaxPost({
        url: `/api/quizlet/students-dictionaries/${studentId}/words-batch`,
        body: { subgroup_id: subgroupId, ...changes },
    });

export const setQuizletStudentHidden = (studentId: number, hidden: boolean) =>
    hidden
        ? AjaxPost({ url: `/api/quizlet/students-dictionaries/${studentId}/hidden`, body: {} })
        : AjaxDelete({ url: `/api/quizlet/students-dictionaries/${studentId}/hidden` });
