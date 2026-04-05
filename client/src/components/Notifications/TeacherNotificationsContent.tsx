import React from "react";
import { useNavigate } from "react-router-dom";

import { TTeacherNotification, TTeacherNotificationWithActivity } from "models/TNotification";

// const getTypeName = (item: TTeacherNotificationWithActivity) => {
//     switch (item.type) {
//         case "drilling_try":
//             return "ごい";
//         case "hieroglyph_try":
//             return "かんじ";
//         case "assessment_try":
//             return "タスク";
//         case "final_boss_try":
//             return "Финальный босс";
//     }
// };

const splitDateTime = (datetime?: string | null) => {
    if (!datetime) {
        return { date: "-", time: "-" };
    }

    const [date = "-", time = "-"] = datetime.split(" ");

    return { date, time };
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

const getMistakesCount = (item: TTeacherNotificationWithActivity): number | null => {
    const tryData = item.activity_try as Record<string, unknown>;

    if (typeof tryData.mistakes_count === "number") {
        return tryData.mistakes_count;
    }

    if (typeof tryData.mistakeCount === "number") {
        return tryData.mistakeCount;
    }

    return null;
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

    const isClickable = hasLink(item);
    const { date, time } = splitDateTime(item.creation_datetime);
    const mistakesCount = getMistakesCount(item);

    const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
        if (!isClickable) {
            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleClick();
        }
    };

    const isMessageItem = (item: TTeacherNotification): boolean => {
        return item.type === null || item.type === undefined;
    };

    const content = isMessageItem(item) ? item.message || "Уведомление" : item.lesson.name;
    const studentLabel = `${item.user.nickname} (${item.user.name})`;

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
            <div className="notification__item-chip notification__item-chip--user" title={studentLabel}>
                <i className="bi bi-person" aria-hidden="true"></i>
                <span>{studentLabel}</span>
            </div>
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
                <span>Ошибки: {mistakesCount ?? "-"}</span>
            </div>
            <div className="notification__item-inline-content">{content}</div>
        </div>
    );
};

interface TeacherNotificationsProps {
    notifications: TTeacherNotification[];
    closeModal: () => void;
}

const TeacherNotifications = ({ notifications, closeModal }: TeacherNotificationsProps) => {
    return (
        <div className="d-flex flex-column gap-2">
            {notifications.map((item, i) => (
                <ItemContent key={`${item.id}_${i}`} item={item} closeModal={closeModal} />
            ))}
        </div>
    );
};

export default TeacherNotifications;
