import React from "react";
import { useNavigate } from "react-router-dom";

import { getStrHHMMSS } from "libs/useTimer";
import { TTeacherNotification, TTeacherNotificationWithActivity } from "models/TNotification";

import { NotificationDateTime } from "./Items/NotificationDateTime";
import { NotificationUser } from "./Items/NotificationUser";

const getTypeName = (item: TTeacherNotificationWithActivity) => {
    switch (item.type) {
        case "drilling_try":
            return "ごい";
        case "hieroglyph_try":
            return "かんじ";
        case "assessment_try":
            return "タスク";
        case "final_boss_try":
            return "Финальный босс";
    }
};

const hasLink = (item: TTeacherNotificationWithActivity): boolean => {
    switch (item.type) {
        case "drilling_try":
        case "hieroglyph_try":
            return false;
        case "assessment_try":
        case "final_boss_try":
            return true;
    }
    return false;
};

const getLinkByName = (item: TTeacherNotificationWithActivity) => {
    switch (item.type) {
        case "drilling_try":
            return "drilling/try";
        case "hieroglyph_try":
            return "hieroglyph/try";
        case "assessment_try":
            return "assessment/try";
        case "final_boss_try":
            return "final_boss/try";
    }
};

interface ItemContentProps {
    item: TTeacherNotification;
    closeModal: () => void;
}

const ItemContent = ({ item, closeModal }: ItemContentProps) => {
    const navigate = useNavigate();

    if (item.type === null) {
        return <div>{item.message}</div>;
    }

    const handleClick = () => {
        if (hasLink(item)) {
            navigate(`/${getLinkByName(item)}/${item.activity_try_id}`);
            closeModal();
        }
    };

    const isMessageItem = (item: TTeacherNotification): boolean => {
        return item.type === null || item.type === undefined;
    };

    const endDatetime = item.activity_try.end_datetime
        ? new Date(item.activity_try.end_datetime).getTime()
        : Date.now();
    const elapsedTime = endDatetime - new Date(item.activity_try.start_datetime).getTime();

    return (
        <div className={`notification__item ${item.viewed ? "viewed" : ""}`} onClick={handleClick}>
            <div className="d-flex justify-content-center">
                <NotificationDateTime datetime={item.creation_datetime} />
                <NotificationUser userData={item.user} />
            </div>
            <div>
                Выполнил {getTypeName(item)} из урока "{item.lesson.name}" за {getStrHHMMSS(elapsedTime)}
            </div>
            {!isMessageItem(item) && hasLink(item) ? (
                <div className="notification__item-button-block">
                    <input type="button" className="btn btn-violet" value={"Перейти"} onClick={handleClick} />
                </div>
            ) : null}
        </div>
    );
};

interface TeacherNotificationsProps {
    notifications: TTeacherNotification[];
    closeModal: () => void;
}

const TeacherNotifications = ({ notifications, closeModal }: TeacherNotificationsProps) => {
    return (
        <div className="d-flex flex-column gap-3">
            {notifications.map((item, i) => (
                <ItemContent key={`${item.id}_${i}`} item={item} closeModal={closeModal} />
            ))}
        </div>
    );
};

export default TeacherNotifications;
