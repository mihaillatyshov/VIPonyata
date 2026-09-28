import { useCallback, useEffect, useRef } from "react";

import { markAllNotificationsAsRead, notificationsKeys, notificationsQueries } from "api/notifications";
import { useUserIsStudent } from "libs/user";

import { useQuery, useQueryClient } from "@tanstack/react-query";

const UNREAD_POLL_INTERVAL_MS = 60_000;

/**
 * Единственный периодический опрос уведомлений в приложении (монтируется один раз в корне).
 * Раз в минуту запрашивает лёгкий счётчик непрочитанных; во фоновой вкладке не опрашивает,
 * а при возвращении на вкладку обновляет счётчик, если он устарел.
 */
export const useNotificationsPolling = () => {
    useQuery({
        ...notificationsQueries.unreadCount(),
        refetchInterval: UNREAD_POLL_INTERVAL_MS,
        refetchOnWindowFocus: true,
    });
};

/** Число непрочитанных уведомлений; `null` — ещё не загружено. Запросы делает `useNotificationsPolling`. */
export const useUnreadNotificationsCount = (): number | null => {
    return useQuery({ ...notificationsQueries.unreadCount(), enabled: false }).data ?? null;
};

export const useRefreshUnreadNotificationsCount = () => {
    const queryClient = useQueryClient();

    return useCallback(
        () => queryClient.invalidateQueries({ queryKey: notificationsKeys.unreadCount() }),
        [queryClient],
    );
};

export const useMarkAllNotificationsAsRead = () => {
    const queryClient = useQueryClient();
    const refreshUnreadCount = useRefreshUnreadNotificationsCount();

    return useCallback(() => {
        queryClient.setQueryData(notificationsKeys.unreadCount(), 0);
        markAllNotificationsAsRead()
            .catch(() => undefined)
            .finally(() => {
                refreshUnreadCount();
            });
    }, [queryClient, refreshUnreadCount]);
};

/** Данные главной ученика (уведомления, задания, статистика Quizlet). У учителя запрос не выполняется. */
export const useStudentHubQuery = () => {
    const isStudent = useUserIsStudent();
    return useQuery({ ...notificationsQueries.studentHub(), enabled: isStudent });
};

/**
 * Данные главной ученика для `AssignmentsHub`/`StudentQuizlet`. Своего таймера нет: загрузка при монтировании
 * (если данные устарели), при появлении новых уведомлений (рост счётчика из `useNotificationsPolling`)
 * и при возвращении на вкладку. `refreshHub()` — принудительный перезапрос.
 */
export const useNotificationsHubSync = () => {
    const queryClient = useQueryClient();
    const isStudent = useUserIsStudent();
    const hubQuery = useQuery({ ...notificationsQueries.studentHub(), enabled: isStudent, refetchOnWindowFocus: true });
    const unreadCount = useUnreadNotificationsCount();
    const prevUnreadCountRef = useRef<number | null>(unreadCount);

    const refreshHub = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: notificationsKeys.studentHub() });
    }, [queryClient]);

    useEffect(() => {
        const prevUnreadCount = prevUnreadCountRef.current;
        prevUnreadCountRef.current = unreadCount;

        if (prevUnreadCount !== null && unreadCount !== null && unreadCount > prevUnreadCount) {
            refreshHub();
        }
    }, [refreshHub, unreadCount]);

    return { hubQuery, refreshHub };
};
