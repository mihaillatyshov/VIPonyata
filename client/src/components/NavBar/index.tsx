import React, { useLayoutEffect, useState } from "react";
import StudentDictionary from "./Dictionary/StudentDictionary";
import Profile from "./Profile";
import { Link } from "react-router-dom";
import Notifications from "components/Notifications/Notifications";

import styles from "./StyleNavBar.module.css";
import { AjaxGet } from "libs/ServerAPI";
import { TAnyNotification } from "models/TNotification";

const NavBar = () => {
    const [showNotifications, setShowNotifications] = useState<boolean>(false);
    const [notifications, setNotifications] = useState<TAnyNotification[]>([]);

    const openNotifications = () => {
        console.log("open");
        setShowNotifications(true);
    };
    const closeNotifications = () => {
        console.log("close");
        setShowNotifications(false);
    };

    useLayoutEffect(() => {
        AjaxGet<{ notifications: TAnyNotification[] }>({ url: "/api/notifications" })
            .then((json) => {
                console.log(json);
                setNotifications(json.notifications);
            })
            .catch((data) => {
                console.log(data);
            });
    }, []);

    return (
        <div className="container mainNavBar">
            <div className="row justify-content-center align-items-center">
                <div className="col-12 col-sm-8 col-md-6 col-lg-4 px-0 align-items-center">
                    <Link to="/">
                        <img src="/svg/Logo.svg" alt="Главная" height={100} />
                    </Link>
                </div>
                <div className="col-4 mx-lg-auto order-2 order-lg-1 d-flex flex-column align-items-center">
                    <StudentDictionary />
                </div>
                <div className="col-12 col-sm-4 col-md-6 col-lg-4 align-items-end order-1 order-lg-2">
                    <div className="d-flex justify-content-end align-items-center">
                        <div
                            className={`position-relative me-4 ${styles.notificationsBlock}`}
                            onClick={openNotifications}
                        >
                            <i className="bi bi-bell-fill font-icon-height-0" style={{ fontSize: "32px" }}></i>
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                {notifications.length >= 10 ? "9+" : notifications.length}
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
