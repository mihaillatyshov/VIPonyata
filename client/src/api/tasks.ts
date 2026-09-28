import { AjaxDelete, AjaxGet, AjaxPatch, AjaxPost } from "libs/ServerAPI";
import { TTeacherAssessmentAnyItem } from "models/Activity/Items/TAssessmentItems";
import { THomeworkAssignment, THomeworkAssignmentTask, THomeworkTry, TTaskBankItem } from "models/TTasks";

import { keepPreviousData, queryOptions } from "@tanstack/react-query";

export interface TTasksStudentOption {
    id: number;
    name: string;
    nickname: string;
}

export interface TTasksLessonOption {
    id: number;
    name: string;
    number: number;
    course_id: number;
    img?: string | null;
}

export interface TTasksOptions {
    students: TTasksStudentOption[];
    lessons: TTasksLessonOption[];
    hidden_lesson_ids: number[];
}

export interface TTaskBank {
    lessons: TTasksLessonOption[];
    items: TTaskBankItem[];
    hidden_lesson_ids: number[];
}

export type THomeworkTargetStatus = "pending" | "completed" | "cancelled";

export interface THomeworkAssignmentListItem {
    assignment: THomeworkAssignment;
    tasks: THomeworkAssignmentTask[];
    targets: Array<{
        id: number;
        student: TTasksStudentOption | null;
        status: THomeworkTargetStatus;
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

export interface TTaskBankItemDraft {
    id?: number;
    title: string;
    lesson_id: number | null;
    task: TTeacherAssessmentAnyItem;
}

export interface TCreateHomeworkPayload {
    title: string;
    student_ids: number[];
    tasks: Array<{
        task_bank_item_id: number | null;
        lesson_id: number | null;
        sort: number;
        title: string;
        task: TTeacherAssessmentAnyItem;
    }>;
}

export const tasksKeys = {
    all: ["tasks"] as const,
    options: () => [...tasksKeys.all, "options"] as const,
    bankAll: () => [...tasksKeys.all, "bank"] as const,
    /** Банк; с `studentId` — ещё и сколько раз ученик выполнял каждое задание. */
    bank: (studentId: number | null) => [...tasksKeys.bankAll(), { studentId }] as const,
    assignments: () => [...tasksKeys.all, "assignments"] as const,
};

export const tasksQueries = {
    options: () =>
        queryOptions({
            queryKey: tasksKeys.options(),
            queryFn: ({ signal }) => AjaxGet<TTasksOptions>({ url: "/api/tasks/options", signal }),
        }),
    bank: (studentId: number | null) =>
        queryOptions({
            queryKey: tasksKeys.bank(studentId),
            queryFn: ({ signal }) =>
                AjaxGet<TTaskBank>({ url: "/api/tasks/bank", urlParams: { student_id: studentId }, signal }),
            // При смене ученика показываем прежний банк, пока грузится новый.
            placeholderData: keepPreviousData,
        }),
    assignments: () =>
        queryOptions({
            queryKey: tasksKeys.assignments(),
            queryFn: ({ signal }) =>
                AjaxGet<{ assignments: THomeworkAssignmentListItem[] }>({ url: "/api/tasks/assignments", signal }),
        }),
};

export const saveTaskBankItem = (item: TTaskBankItemDraft) =>
    item.id === undefined
        ? AjaxPost({ url: "/api/tasks/bank", body: item })
        : AjaxPatch({ url: `/api/tasks/bank/${item.id}`, body: item });

export const deleteTaskBankItem = (itemId: number) => AjaxDelete({ url: `/api/tasks/bank/${itemId}` });

export const setTaskBankLessonHidden = (lessonId: number, hidden: boolean) =>
    hidden
        ? AjaxPost({ url: `/api/tasks/bank/lessons/${lessonId}/hidden`, body: {} })
        : AjaxDelete({ url: `/api/tasks/bank/lessons/${lessonId}/hidden` });

export const createHomeworkAssignment = (payload: TCreateHomeworkPayload) =>
    AjaxPost({ url: "/api/tasks/assignments", body: payload });

export const cancelHomeworkAssignmentTarget = (targetId: number) =>
    AjaxDelete({ url: `/api/tasks/assignment-targets/${targetId}` });
