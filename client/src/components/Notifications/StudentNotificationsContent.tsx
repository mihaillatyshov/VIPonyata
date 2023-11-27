import React from "react";

import {
    TStudentNotification,
    TStudentNotificationActivity,
    TStudentNotificationCustom,
    TStudentNotificationShareAny,
} from "models/TNotification";
import { useNavigate } from "react-router-dom";

import { NotificationDateTime } from "./Items/NotificationDateTime";

const getTypeName = (item: TStudentNotification) => {
    switch (item.type) {
        case "course":
            return "курс";
        case "lesson":
            return "урок";
        case "assessment_try":
            return "Ассессмент";
        case "final_boss_try":
            return "Финальный босс";
    }
};

const hasLink = (item: TStudentNotification): item is TStudentNotificationCustom => {
    switch (item.type) {
        case "course":
        case "lesson":
        case "assessment_try":
        case "final_boss_try":
            return true;
    }
    return false;
};

const getLinkByName = (item: TStudentNotificationCustom) => {
    switch (item.type) {
        case "course":
            return `/courses/${item.course_id}`;
        case "lesson":
            return `/lessons/${item.lesson_id}`;
        case "assessment_try":
            return `/assessment/try/${item.activity_try_id}`;
        case "final_boss_try":
            return `/final_boss/try/${item.activity_try_id}`;
    }
};

interface ActivityItemContentProps {
    item: TStudentNotificationActivity;
}

const ActivityItemContent = ({ item }: ActivityItemContentProps) => {
    return (
        <div className="d-flex gap-1 flex-wrap">
            <span> Проверен {getTypeName(item)} </span>
            <span> из урока "{item.lesson.name}" </span>
            <span> выполненный {item.activity_try.end_datetime} </span>
        </div>
    );
};

interface ShareItemContentProps {
    item: TStudentNotificationShareAny;
}

const ShareItemContent = ({ item }: ShareItemContentProps) => {
    const name = item.type === "course" ? item.course.name : item.lesson.name;

    return (
        <div className="d-flex gap-1 flex-wrap">
            <span> Открыт новый {getTypeName(item)}: </span>
            <span> "{name}" </span>
        </div>
    );
};

interface ItemContentProps {
    item: TStudentNotification;
    closeModal: () => void;
}

const ItemContent = ({ item, closeModal }: ItemContentProps) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (hasLink(item)) {
            navigate(getLinkByName(item));
            closeModal();
        }
    };

    const isShareItem = (item: TStudentNotification): item is TStudentNotificationShareAny => {
        return item.type === "course" || item.type === "lesson";
    };

    const isActivityItem = (item: TStudentNotification): item is TStudentNotificationActivity => {
        return item.type === "assessment_try" || item.type === "final_boss_try";
    };

    return (
        <div className="notification__item" onClick={handleClick}>
            <NotificationDateTime datetime={item.creation_datetime} />
            {isShareItem(item) && <ShareItemContent item={item} />}
            {isActivityItem(item) && <ActivityItemContent item={item} />}
        </div>
    );
};

interface StudentNotificationsProps {
    notifications: TStudentNotification[];
    closeModal: () => void;
}

const StudentNotifications = ({ notifications, closeModal }: StudentNotificationsProps) => {
    console.log(notifications);
    return (
        <div className="d-flex flex-column gap-3">
            {notifications.map((item, i) => (
                <ItemContent key={`${item.id}_${i}`} item={item} closeModal={closeModal} />
            ))}
        </div>
    );
};

export default StudentNotifications;
