import { useLayoutEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import Notifications from "components/Notifications/Notifications";
import { AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { TNotificationBase } from "models/TNotification";
import { useNotificationsHubSync } from "redux/funcs/notificationsHub";
import { isTeacher } from "redux/funcs/user";
import { useAppSelector } from "redux/hooks";
import { selectHubNotifications } from "redux/slices/notificationsHubSlice";
import { selectUser } from "redux/slices/userSlice";

import Profile from "./Profile";
import styles from "./StyleNavBar.module.css";

const NavBar = () => {
    const [showNotifications, setShowNotifications] = useState<boolean>(false);
    const user = useAppSelector(selectUser);
    const notifications = useAppSelector(selectHubNotifications);
    const location = useLocation();
    const isFlashcardExerciseRoute = location.pathname === "/quizlet/flashcards";
    const isReviewRoute = location.pathname.startsWith("/review");
    const isTeacherHistoryRoute = location.pathname.startsWith("/teacher/history");
    const isTeacherUser = user.data.loadStatus === LoadStatus.DONE && user.data.isAuth && isTeacher(user.data.userData);

    useNotificationsHubSync();

    const openNotifications = () => setShowNotifications(true);
    const closeNotifications = () => setShowNotifications(false);

    useLayoutEffect(() => {
        if (showNotifications && notifications.length > 0) {
            const notificationIds = (notifications as TNotificationBase[])
                .filter((notification) => !notification.viewed && !notification.deleted)
                .map((notification) => notification.id);
            if (notificationIds.length > 0) {
                AjaxPost({ url: "/api/notifications/read", body: { notification_ids: notificationIds } });
            }
        }
    }, [showNotifications, notifications]);

    const getNotificationStr = (): string => {
        const newNotificationsCount = (notifications as TNotificationBase[]).filter(
            (notification) => !notification.viewed && !notification.deleted,
        ).length;
        if (newNotificationsCount === 0) return "";
        if (newNotificationsCount >= 10) return "9+";
        return newNotificationsCount.toString();
    };

    const notificationStr = getNotificationStr();

    return (
        <div className={`container mainNavBar ${styles.navShell}`}>
            <div className={styles.navInner}>
                <div className={styles.logoSection}>
                    <Link to="/" className={styles.logoLink}>
                        <img className={`d-none d-lg-block ${styles.logoFull}`} src="/svg/LogoFull.svg" alt="Главная" />
                        <img
                            className={`d-block d-lg-none ${styles.logoSmall}`}
                            src="/svg/LogoSmall.svg"
                            alt="Главная"
                        />
                    </Link>
                </div>
                <div className={styles.centerSection}>
                    {isTeacherUser &&
                        (isReviewRoute ? (
                            <span
                                className={`d-flex a-clear navbar-dictionary-title ap-japanesefont ${styles.quizletButton} ${styles.quizletButtonDisabled}`}
                                aria-disabled="true"
                            >
                                <span className={styles.quizletButtonLabel}>復習</span>
                                <i
                                    className={`bi bi-journal-bookmark ${styles.quizletButtonIcon}`}
                                    aria-hidden="true"
                                ></i>
                            </span>
                        ) : (
                            <Link
                                className={`d-flex a-clear navbar-dictionary-title ap-japanesefont ${styles.quizletButton}`}
                                to="/review"
                            >
                                <span className={styles.quizletButtonLabel}>復習</span>
                                <i
                                    className={`bi bi-journal-bookmark ${styles.quizletButtonIcon}`}
                                    aria-hidden="true"
                                ></i>
                            </Link>
                        ))}

                    {isFlashcardExerciseRoute ? (
                        <span
                            className={`d-flex a-clear navbar-dictionary-title ap-japanesefont ${styles.quizletButton} ${styles.quizletButtonDisabled}`}
                            aria-disabled="true"
                        >
                            <span className={styles.quizletButtonLabel}>ワードラボ</span>
                            <i className={`bi bi-magic ${styles.quizletButtonIcon}`} aria-hidden="true"></i>
                        </span>
                    ) : (
                        <Link
                            className={`d-flex a-clear navbar-dictionary-title ap-japanesefont ${styles.quizletButton}`}
                            to="/quizlet"
                        >
                            <span className={styles.quizletButtonLabel}>ワードラボ</span>
                            <i className={`bi bi-magic ${styles.quizletButtonIcon}`} aria-hidden="true"></i>
                        </Link>
                    )}
                </div>
                <div className={styles.actionsSection}>
                    {isTeacherUser && (
                        <Link
                            to="/teacher/history"
                            aria-label="История"
                            className={`a-clear ${styles.notificationsBlock} ${
                                isTeacherHistoryRoute ? styles.navIconButtonActive : ""
                            }`}
                        >
                            <i className={`bi bi-book font-icon-height-0 ${styles.notificationIcon}`}></i>
                        </Link>
                    )}
                    <div className={`position-relative ${styles.notificationsBlock}`} onClick={openNotifications}>
                        <i className={`bi bi-bell font-icon-height-0 ${styles.notificationIcon}`}></i>
                        <span
                            className={`position-absolute top-0 start-100 translate-middle badge rounded-pill ${
                                styles.notificationBadge
                            } ${!notificationStr ? styles.notificationBadgeHidden : ""}`}
                        >
                            {notificationStr}
                        </span>
                    </div>
                    <Notifications
                        isShow={showNotifications}
                        close={closeNotifications}
                        notifications={notifications}
                    />

                    <Profile />
                </div>
            </div>
        </div>
    );
};

export default NavBar;
