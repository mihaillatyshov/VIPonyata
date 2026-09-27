import { useCallback, useEffect, useRef } from "react";

import { AjaxGet, AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { TStudentNotification } from "models/TNotification";
import { TQuizletSession } from "models/TQuizlet";
import { isTeacher } from "redux/funcs/user";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import {
    resetNotificationsHub,
    selectNotificationsHub,
    selectUnreadNotificationsCount,
    setNotificationsHubData,
    setNotificationsHubError,
    setNotificationsHubLoading,
    setUnreadNotificationsCount,
    TStudentHomeworkAssignmentRecord,
    TStudentQuizletAssignmentRecord,
} from "redux/slices/notificationsHubSlice";
import { selectUser } from "redux/slices/userSlice";

const UNREAD_POLL_INTERVAL_MS = 60_000;
const STALE_INTERVAL_MS = 15_000;

// Общий на всё приложение флаг: несколько компонентов, смонтированных одновременно, не дублируют запрос хаба.
let isHubRequestInFlight = false;

export const useRefreshUnreadNotificationsCount = () => {
    const dispatch = useAppDispatch();

    return useCallback(() => {
        return AjaxGet<{ count: number }>({ url: "/api/notifications/unread_count" })
            .then((json) => {
                dispatch(setUnreadNotificationsCount(json.count));
            })
            .catch(() => {
                return;
            });
    }, [dispatch]);
};

export const useMarkAllNotificationsAsRead = () => {
    const dispatch = useAppDispatch();
    const refreshUnreadCount = useRefreshUnreadNotificationsCount();

    return useCallback(() => {
        dispatch(setUnreadNotificationsCount(0));
        AjaxPost({ url: "/api/notifications/read_all" })
            .catch(() => {
                return;
            })
            .finally(() => {
                refreshUnreadCount();
            });
    }, [dispatch, refreshUnreadCount]);
};

/**
 * Единственный периодический опрос уведомлений в приложении (монтируется один раз в корне).
 * Раз в минуту запрашивает лёгкий счётчик непрочитанных; во фоновой вкладке не опрашивает,
 * а при возвращении на вкладку обновляет счётчик, если он устарел.
 */
export const useNotificationsPolling = () => {
    const refreshUnreadCount = useRefreshUnreadNotificationsCount();

    useEffect(() => {
        let lastLoadedAt = 0;

        const refresh = () => {
            if (document.hidden) {
                return;
            }

            lastLoadedAt = Date.now();
            refreshUnreadCount();
        };

        const handleVisibilityChange = () => {
            if (!document.hidden && Date.now() - lastLoadedAt >= STALE_INTERVAL_MS) {
                refresh();
            }
        };

        refresh();
        const timerId = window.setInterval(refresh, UNREAD_POLL_INTERVAL_MS);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.clearInterval(timerId);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [refreshUnreadCount]);
};

/**
 * Данные главной ученика (уведомления, задания, статистика Quizlet) для `AssignmentsHub`/`StudentQuizlet`.
 * Своего таймера нет: загрузка при монтировании (если данные устарели), при появлении новых уведомлений
 * (рост счётчика из `useNotificationsPolling`) и при возвращении на вкладку. `refreshHub(true)` — принудительно.
 */
export const useNotificationsHubSync = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser).data;
    const hub = useAppSelector(selectNotificationsHub);
    const unreadCount = useAppSelector(selectUnreadNotificationsCount);
    const prevUnreadCountRef = useRef<number | null>(unreadCount);

    const refreshHub = useCallback(
        (force = false) => {
            if (user.loadStatus !== LoadStatus.DONE) {
                return;
            }

            if (!user.isAuth) {
                dispatch(resetNotificationsHub());
                return;
            }

            if (isTeacher(user.userData) || isHubRequestInFlight) {
                return;
            }

            if (!force && hub.lastLoadedAt !== null && Date.now() - hub.lastLoadedAt < STALE_INTERVAL_MS) {
                return;
            }

            isHubRequestInFlight = true;
            dispatch(setNotificationsHubLoading());

            Promise.all([
                AjaxGet<{ notifications: TStudentNotification[] }>({ url: "/api/notifications" }),
                AjaxGet<{ assignments: TStudentQuizletAssignmentRecord[] }>({ url: "/api/quizlet/assignments/my" }),
                AjaxGet<{ assignments: TStudentHomeworkAssignmentRecord[] }>({ url: "/api/tasks/assignments/my" }),
                AjaxGet<{ sessions: TQuizletSession[] }>({ url: "/api/quizlet/sessions/stats" }),
            ])
                .then(([notificationsResponse, assignmentsResponse, homeworkAssignmentsResponse, sessionsResponse]) => {
                    dispatch(
                        setNotificationsHubData({
                            notifications: notificationsResponse.notifications,
                            quizletAssignments: assignmentsResponse.assignments,
                            homeworkAssignments: homeworkAssignmentsResponse.assignments,
                            quizletSessions: sessionsResponse.sessions,
                            loadedAt: Date.now(),
                        }),
                    );
                })
                .catch(() => {
                    dispatch(setNotificationsHubError());
                })
                .finally(() => {
                    isHubRequestInFlight = false;
                });
        },
        [dispatch, hub.lastLoadedAt, user],
    );

    useEffect(() => {
        refreshHub();
    }, [refreshHub]);

    useEffect(() => {
        const prevUnreadCount = prevUnreadCountRef.current;
        prevUnreadCountRef.current = unreadCount;

        if (prevUnreadCount !== null && unreadCount !== null && unreadCount > prevUnreadCount) {
            refreshHub(true);
        }
    }, [refreshHub, unreadCount]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                refreshHub();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [refreshHub]);

    return { refreshHub };
};
