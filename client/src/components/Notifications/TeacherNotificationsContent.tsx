import React from "react";
import { TTeacherNotification, TTeacherNotificationWithActivity } from "models/TNotification";
import { Link } from "react-router-dom";
import { getStrHHMMSS } from "libs/useTimer";

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

interface ItemContentProps {
    item: TTeacherNotification;
}

const ItemContent = ({ item }: ItemContentProps) => {
    if (item.type === null) {
        return <div>item.message</div>;
    }

    const endDatetime = item.activity_try.end_datetime
        ? new Date(item.activity_try.end_datetime).getTime()
        : Date.now();
    const elapsedTime = endDatetime - new Date(item.activity_try.start_datetime).getTime();

    return (
        <div>
            <Link to={`/${item.type}/${item.activity_try_id}`}>
                <span>
                    {item.user.name} ({item.user.nickname})
                </span>
                <span> выполнил {getTypeName(item)} </span>
                <span> из урока "{item.lesson.name}" </span>
                <span> за {getStrHHMMSS(elapsedTime)}. </span>
            </Link>
        </div>
    );
};

interface TeacherNotificationsProps {
    notifications: TTeacherNotification[];
}

const TeacherNotifications = ({ notifications }: TeacherNotificationsProps) => {
    return (
        <div>
            {notifications.map((item, i) => (
                <div key={`${item.id}_${i}`}>
                    <ItemContent item={item} />
                </div>
            ))}
        </div>
    );
};

export default TeacherNotifications;