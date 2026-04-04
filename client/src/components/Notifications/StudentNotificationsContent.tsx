import React from "react";
import { useNavigate } from "react-router-dom";

import { TStudentNotification, TStudentNotificationCustom } from "models/TNotification";

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

const splitDateTime = (datetime?: string | null) => {
    if (!datetime) {
        return { date: "-", time: "-" };
    }

    const [date = "-", time = "-"] = datetime.split(" ");

    return { date, time };
};

const getDisplayDateTime = (item: TStudentNotification) => {
    if (item.type === "assessment_try" || item.type === "final_boss_try") {
        return splitDateTime(item.activity_try.end_datetime || item.creation_datetime);
    }

    return splitDateTime(item.creation_datetime);
};

const getMistakesCount = (item: TStudentNotification): number | null => {
    if (item.type !== "assessment_try" && item.type !== "final_boss_try") {
        return null;
    }

    const tryData = item.activity_try as Record<string, unknown>;

    if (typeof tryData.mistakes_count === "number") {
        return tryData.mistakes_count;
    }

    if (typeof tryData.mistakeCount === "number") {
        return tryData.mistakeCount;
    }

    return null;
};

const getLessonTitle = (item: TStudentNotification) => {
    if (item.type === "lesson" || item.type === "assessment_try" || item.type === "final_boss_try") {
        return item.lesson.name;
    }

    if (item.type === "course") {
        return item.course.name;
    }

    return "Уведомление";
};

interface ItemContentProps {
    item: TStudentNotification;
    closeModal: () => void;
}

const ItemContent = ({ item, closeModal }: ItemContentProps) => {
    const navigate = useNavigate();
    const isClickable = hasLink(item);
    const { date, time } = getDisplayDateTime(item);
    const mistakesCount = getMistakesCount(item);
    const lessonTitle = getLessonTitle(item);

    const handleClick = () => {
        if (isClickable) {
            navigate(getLinkByName(item));
            closeModal();
        }
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
        if (!isClickable) {
            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleClick();
        }
    };

    const isMessageItem = (item: TStudentNotification): boolean => {
        return item.type === null || item.type === undefined;
    };

    const content = isMessageItem(item) ? item.message || "Уведомление" : getLessonTitle(item);

    return (
        <div
            className={`notification__item notification__item--compact ${item.viewed ? "viewed" : ""} ${
                isClickable ? "clickable" : ""
            }`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
        >
            <div className="notification__item-chip">
                <i className="bi bi-calendar3" aria-hidden="true"></i>
                <span>{date}</span>
            </div>
            <div className="notification__item-chip">
                <i className="bi bi-clock" aria-hidden="true"></i>
                <span>{time}</span>
            </div>
            <div className="notification__item-chip" title="Количество ошибок">
                <i className="bi bi-exclamation-circle" aria-hidden="true"></i>
                <span>{mistakesCount ?? "-"}</span>
            </div>
            <div className="notification__item-inline-content">{content}</div>
        </div>
    );
};

interface StudentNotificationsProps {
    notifications: TStudentNotification[];
    closeModal: () => void;
}

const StudentNotifications = ({ notifications, closeModal }: StudentNotificationsProps) => {
    return (
        <div className="d-flex flex-column gap-2">
            {notifications.map((item, i) => (
                <ItemContent key={`${item.id}_${i}`} item={item} closeModal={closeModal} />
            ))}
        </div>
    );
};

export default StudentNotifications;
