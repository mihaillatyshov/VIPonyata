import React, { useLayoutEffect, useState } from "react";
import { Link } from "react-router-dom";

import Notifications from "components/Notifications/Notifications";
import { AjaxGet, AjaxPost } from "libs/ServerAPI";
import { TAnyNotifications, TNotificationBase } from "models/TNotification";
import { useAppSelector } from "redux/hooks";
import { selectUser } from "redux/slices/userSlice";

import { Dictionary } from "./Dictionary";
import Profile from "./Profile";
import styles from "./StyleNavBar.module.css";

const NavBar = () => {
    const [showNotifications, setShowNotifications] = useState<boolean>(false);
    const [notifications, setNotifications] = useState<TAnyNotifications>([]);
    const user = useAppSelector(selectUser);

    const openNotifications = () => setShowNotifications(true);
    const closeNotifications = () => setShowNotifications(false);

    const getNotifications = () => {
        AjaxGet<{ notifications: TAnyNotifications }>({ url: "/api/notifications" })
            .then((json) => {
                setNotifications(json.notifications);
            })
            .catch((data) => {
                // TODO: handle error
            });
    };

    useLayoutEffect(() => {
        if (!showNotifications) {
            getNotifications();
        }
        const timerId = setInterval(() => {
            if (!showNotifications) {
                getNotifications();
            }
        }, 60_000);

        return () => clearInterval(timerId);
    }, [user, showNotifications]);

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

    return (
        <div className="container mainNavBar">
            <div className="d-flex justify-content-center align-items-center">
                <div className="col-2 col-lg-4 px-0 align-items-center">
                    <Link to="/">
                        <img className="d-none d-lg-block" src="/svg/LogoFull.svg" alt="Главная" height={100} />
                        <img className="d-block d-lg-none" src="/svg/LogoSmall.svg" alt="Главная" height={60} />
                    </Link>
                </div>
                <div className="col-6 col-lg-4 mx-auto d-flex align-items-center">
                    <Dictionary />
                </div>
                <div className="col-4 align-items-end">
                    <div className="d-flex justify-content-end align-items-center">
                        <div
                            className={`position-relative me-3 ${styles.notificationsBlock}`}
                            onClick={openNotifications}
                        >
                            <i className="bi bi-bell-fill font-icon-height-0" style={{ fontSize: "32px" }}></i>
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success">
                                {getNotificationStr()}
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
        </div>
    );
};

export default NavBar;
