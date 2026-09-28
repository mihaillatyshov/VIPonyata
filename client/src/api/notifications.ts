import { AjaxGet, AjaxPost } from "libs/ServerAPI";
import { TStudentNotification } from "models/TNotification";
import {
    TQuizletAssignment,
    TQuizletAssignmentResult,
    TQuizletAssignmentTarget,
    TQuizletSession,
} from "models/TQuizlet";
import { THomeworkAssignment, THomeworkAssignmentTarget, THomeworkAssignmentTask, THomeworkTry } from "models/TTasks";

import { queryOptions } from "@tanstack/react-query";

export interface TStudentQuizletAssignmentRecord {
    assignment: TQuizletAssignment;
    target: TQuizletAssignmentTarget;
    subgroups?: Array<{
        id: number;
        title: string;
    }>;
    result: TQuizletAssignmentResult | null;
    active_session_id: number | null;
}

export interface TStudentHomeworkAssignmentRecord {
    assignment: THomeworkAssignment;
    target: THomeworkAssignmentTarget;
    tasks: THomeworkAssignmentTask[];
    try: THomeworkTry | null;
    active_try_id: number | null;
}

/** Данные главной ученика: уведомления, назначения Quizlet и домашки, статистика тренировок. */
export interface TStudentHub {
    notifications: TStudentNotification[];
    quizletAssignments: TStudentQuizletAssignmentRecord[];
    homeworkAssignments: TStudentHomeworkAssignmentRecord[];
    quizletSessions: TQuizletSession[];
}

/** Данные считаются свежими 15 с: повторный заход на страницу в этот срок не перезапрашивает их. */
export const NOTIFICATIONS_STALE_TIME_MS = 15_000;

export const notificationsKeys = {
    all: ["notifications"] as const,
    unreadCount: () => [...notificationsKeys.all, "unreadCount"] as const,
    studentHub: () => [...notificationsKeys.all, "studentHub"] as const,
};

const fetchStudentHub = async (signal: AbortSignal): Promise<TStudentHub> => {
    const [notifications, quizletAssignments, homeworkAssignments, quizletSessions] = await Promise.all([
        AjaxGet<{ notifications: TStudentNotification[] }>({ url: "/api/notifications", signal }),
        AjaxGet<{ assignments: TStudentQuizletAssignmentRecord[] }>({ url: "/api/quizlet/assignments/my", signal }),
        AjaxGet<{ assignments: TStudentHomeworkAssignmentRecord[] }>({ url: "/api/tasks/assignments/my", signal }),
        AjaxGet<{ sessions: TQuizletSession[] }>({ url: "/api/quizlet/sessions/stats", signal }),
    ]);

    return {
        notifications: notifications.notifications,
        quizletAssignments: quizletAssignments.assignments,
        homeworkAssignments: homeworkAssignments.assignments,
        quizletSessions: quizletSessions.sessions,
    };
};

export const notificationsQueries = {
    /** Непрочитанные уведомления (бейдж в шапке). */
    unreadCount: () =>
        queryOptions({
            queryKey: notificationsKeys.unreadCount(),
            queryFn: ({ signal }) =>
                AjaxGet<{ count: number }>({ url: "/api/notifications/unread_count", signal }).then(
                    (json) => json.count,
                ),
            staleTime: NOTIFICATIONS_STALE_TIME_MS,
        }),
    studentHub: () =>
        queryOptions({
            queryKey: notificationsKeys.studentHub(),
            queryFn: ({ signal }) => fetchStudentHub(signal),
            staleTime: NOTIFICATIONS_STALE_TIME_MS,
        }),
};

export const markAllNotificationsAsRead = () => AjaxPost({ url: "/api/notifications/read_all" });

export const markNotificationsAsRead = (notificationIds: number[]) =>
    AjaxPost({ url: "/api/notifications/read", body: { notification_ids: notificationIds } });
