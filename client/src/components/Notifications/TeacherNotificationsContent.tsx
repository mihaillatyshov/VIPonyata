import React from "react";

import { getStrHHMMSS } from "libs/useTimer";
import { TTeacherNotification, TTeacherNotificationWithActivity } from "models/TNotification";
import { useNavigate } from "react-router-dom";

const getTypeName = (item: TTeacherNotificationWithActivity) => {
    switch (item.type) {
        case "drilling_try":
            return "Дриллинг";
        case "hieroglyph_try":
            return "Иероглифы";
        case "assessment_try":
            return "Ассессмент";
        case "final_boss_try":
            return "Финальный босс";
    }
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
        return <div>item.message</div>;
    }

    const handleClick = () => {
        navigate(`/${getLinkByName(item)}/${item.activity_try_id}`);
        closeModal();
    };

    const endDatetime = item.activity_try.end_datetime
        ? new Date(item.activity_try.end_datetime).getTime()
        : Date.now();
    const elapsedTime = endDatetime - new Date(item.activity_try.start_datetime).getTime();

    return (
        <div className="notification__item d-flex gap-1" onClick={handleClick}>
            <span>
                {item.user.name} ({item.user.nickname})
            </span>
            <span> выполнил {getTypeName(item)} </span>
            <span> из урока "{item.lesson.name}" </span>
            <span> за {getStrHHMMSS(elapsedTime)}. </span>
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
