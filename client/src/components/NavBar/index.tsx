import React, { useLayoutEffect, useState } from "react";

import Notifications from "components/Notifications/Notifications";
import { AjaxGet } from "libs/ServerAPI";
import { TAnyNotification } from "models/TNotification";
import { Link } from "react-router-dom";
import { useAppSelector } from "redux/hooks";
import { selectUser } from "redux/slices/userSlice";

import StudentDictionary from "./Dictionary/StudentDictionary";
import Profile from "./Profile";
import styles from "./StyleNavBar.module.css";

const NavBar = () => {
    const [showNotifications, setShowNotifications] = useState<boolean>(false);
    const [notifications, setNotifications] = useState<TAnyNotification[]>([]);
    const user = useAppSelector(selectUser);

    const openNotifications = () => setShowNotifications(true);
    const closeNotifications = () => setShowNotifications(false);

    const getNotifications = () => {
        AjaxGet<{ notifications: TAnyNotification[] }>({ url: "/api/notifications" })
            .then((json) => {
                setNotifications(json.notifications);
            })
            .catch((data) => {
                console.log(data);
            });
    };

    useLayoutEffect(() => {
        getNotifications();
        let timerId = setInterval(getNotifications, 60_000);

        return () => clearInterval(timerId);
    }, [user]);

    const getNotiifcationStr = (): string => {
        if (notifications.length === 0) return "";
        if (notifications.length >= 10) return "9+";
        return notifications.length.toString();
    };

    return (
        <div className="container mainNavBar">
            <div className="d-flex justify-content-center align-items-center">
                <div className="col-2 col-sm-4 px-0 align-items-center">
                    <Link to="/">
                        <img className="d-none d-lg-block" src="/svg/LogoFull.svg" alt="Главная" height={100} />
                        <img className="d-block d-lg-none" src="/svg/LogoSmall.svg" alt="Главная" height={60} />
                    </Link>
                </div>
                <div className="col-6 col-sm-4 mx-auto d-flex align-items-center">
                    <StudentDictionary />
                </div>
                <div className="col-4 align-items-end">
                    <div className="d-flex justify-content-end align-items-center">
                        <div
                            className={`position-relative me-3 ${styles.notificationsBlock}`}
                            onClick={openNotifications}
                        >
                            <i className="bi bi-bell-fill font-icon-height-0" style={{ fontSize: "32px" }}></i>
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success">
                                {getNotiifcationStr()}
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
