import { useCallback, useEffect } from "react";

import { AjaxGet } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { TAnyNotifications } from "models/TNotification";
import { isTeacher } from "redux/funcs/user";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import {
    resetNotificationsHub,
    selectNotificationsHub,
    setNotificationsHubData,
    setNotificationsHubError,
    setNotificationsHubLoading,
    TStudentQuizletAssignmentRecord,
} from "redux/slices/notificationsHubSlice";
import { selectUser } from "redux/slices/userSlice";

const POLL_INTERVAL_MS = 60_000;
const STALE_INTERVAL_MS = 15_000;

export const useNotificationsHubSync = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser).data;
    const hub = useAppSelector(selectNotificationsHub);

    const refreshHub = useCallback(
        (force = false) => {
            if (user.loadStatus !== LoadStatus.DONE) {
                return;
            }

            if (!user.isAuth) {
                dispatch(resetNotificationsHub());
                return;
            }

            if (!force) {
                if (hub.notificationsStatus === "loading") {
                    return;
                }

                if (hub.lastLoadedAt !== null && Date.now() - hub.lastLoadedAt < STALE_INTERVAL_MS) {
                    return;
                }
            }

            dispatch(setNotificationsHubLoading());

            const requests: [
                Promise<{ notifications: TAnyNotifications }>,
                Promise<{ assignments: TStudentQuizletAssignmentRecord[] }> | null,
            ] = [
                AjaxGet<{ notifications: TAnyNotifications }>({ url: "/api/notifications" }),
                isTeacher(user.userData)
                    ? null
                    : AjaxGet<{ assignments: TStudentQuizletAssignmentRecord[] }>({
                          url: "/api/quizlet/assignments/my",
                      }),
            ];

            Promise.all([requests[0], requests[1]])
                .then(([notificationsResponse, assignmentsResponse]) => {
                    dispatch(
                        setNotificationsHubData({
                            notifications: notificationsResponse.notifications,
                            quizletAssignments: assignmentsResponse?.assignments ?? [],
                            loadedAt: Date.now(),
                        }),
                    );
                })
                .catch(() => {
                    dispatch(setNotificationsHubError());
                });
        },
        [dispatch, hub.lastLoadedAt, hub.notificationsStatus, user],
    );

    useEffect(() => {
        refreshHub();
        const timerId = window.setInterval(() => refreshHub(), POLL_INTERVAL_MS);

        return () => window.clearInterval(timerId);
    }, [refreshHub]);

    return { refreshHub };
};
