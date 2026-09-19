import type { KeyboardEventHandler } from "react";
import { useNavigate } from "react-router-dom";

import { TStudentNotification, TStudentNotificationCustom } from "models/TNotification";

const hasLink = (item: TStudentNotification): item is TStudentNotificationCustom => {
    switch (item.type) {
        case "course":
        case "lesson":
        case "assessment_try":
        case "final_boss_try":
        case "quizlet_assignment":
        case "homework_assignment":
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
        case "quizlet_assignment":
            return `/quizlet/assignments/${item.assignment_id}`;
        case "homework_assignment":
            return `/tasks/assignments/${item.assignment_id}`;
        case "quizlet_personal_dictionary_update":
            return item.quizlet_dictionary_link;
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
    if (item.type === "lesson") {
        return item.lesson.name;
    }

    if (item.type === "assessment_try" || item.type === "final_boss_try") {
        return `${item.lesson.name} (Выполнено)`;
    }

    if (item.type === "course") {
        return item.course.name;
    }

    if (item.type === "quizlet_personal_dictionary_update") {
        return item.quizlet_dictionary_title;
    }

    if (item.type === "quizlet_personal_dictionary_topic_created") {
        return item.quizlet_dictionary_title;
    }

    if (item.type === "quizlet_personal_dictionary_topic_updated") {
        return item.quizlet_dictionary_title;
    }

    if (item.type === "quizlet_personal_dictionary_topic_deleted") {
        return item.quizlet_dictionary_title;
    }

    return "Уведомление";
};

const isAccessNotification = (item: TStudentNotification): boolean => {
    return (
        item.type === "course" ||
        item.type === "lesson" ||
        item.type === "quizlet_assignment" ||
        item.type === "homework_assignment"
    );
};

const isSimpleTextNotification = (item: TStudentNotification) => {
    return (
        item.type === null ||
        item.type === undefined ||
        item.type === "quizlet_personal_dictionary_update" ||
        item.type === "quizlet_personal_dictionary_topic_created" ||
        item.type === "quizlet_personal_dictionary_topic_updated" ||
        item.type === "quizlet_personal_dictionary_topic_deleted"
    );
};

const getNotificationMeta = (item: TStudentNotification) => {
    switch (item.type) {
        case "course":
            return {
                label: "Курс",
                iconClass: "bi-mortarboard",
                toneClass: "notification__item--lesson",
            };
        case "lesson":
            return {
                label: "Урок",
                iconClass: "bi-journal-bookmark",
                toneClass: "notification__item--lesson",
            };
        case "assessment_try":
            return {
                label: "Тест",
                iconClass: "bi-ui-checks-grid",
                toneClass: "notification__item--assessment",
            };
        case "final_boss_try":
            return {
                label: "Финальный босс",
                iconClass: "bi-trophy",
                toneClass: "notification__item--boss",
            };
        case "quizlet_assignment":
            return {
                label: "Quizlet",
                iconClass: "bi-collection",
                toneClass: "notification__item--quizlet",
            };
        case "homework_assignment":
            return {
                label: "Домашняя работа",
                iconClass: "bi-journal-check",
                toneClass: "notification__item--homework",
            };
        case "quizlet_personal_dictionary_update":
        case "quizlet_personal_dictionary_topic_created":
        case "quizlet_personal_dictionary_topic_updated":
        case "quizlet_personal_dictionary_topic_deleted":
            return {
                label: "Словарь",
                iconClass: "bi-bookmark-star",
                toneClass: "notification__item--dictionary",
            };
        default:
            return {
                label: "Уведомление",
                iconClass: "bi-bell",
                toneClass: "notification__item--message",
            };
    }
};

const getNotificationTitle = (item: TStudentNotification) => {
    if (item.type === "quizlet_assignment") {
        return item.quizlet_assignment?.title || "Задание Quizlet";
    }

    if (item.type === "homework_assignment") {
        return item.homework_assignment?.title || "Домашнее задание";
    }

    if (item.type === null || item.type === undefined) {
        return "Сообщение";
    }

    return getLessonTitle(item);
};

const getNotificationSubtitle = (item: TStudentNotification) => {
    if (item.type === "assessment_try" || item.type === "final_boss_try") {
        return "Результат выполнения";
    }

    if (item.type === "course" || item.type === "lesson") {
        return "Открыт новый доступ";
    }

    if (item.type === "quizlet_assignment") {
        return "Новое задание для тренировки";
    }

    if (item.type === "homework_assignment") {
        return "Новое домашнее задание";
    }

    if (
        item.type === "quizlet_personal_dictionary_update" ||
        item.type === "quizlet_personal_dictionary_topic_created" ||
        item.type === "quizlet_personal_dictionary_topic_updated" ||
        item.type === "quizlet_personal_dictionary_topic_deleted"
    ) {
        return "Изменения в словаре";
    }

    return "Системное уведомление";
};

interface StudentNotificationMetric {
    iconClass: string;
    label: string;
    value: string;
}

const getNotificationMetrics = (item: TStudentNotification): StudentNotificationMetric[] => {
    const { date, time } = getDisplayDateTime(item);
    const metrics: StudentNotificationMetric[] = [
        {
            iconClass: "bi-calendar3",
            label: "Дата",
            value: date,
        },
    ];

    if (item.type === "assessment_try" || item.type === "final_boss_try") {
        metrics.push(
            {
                iconClass: "bi-clock",
                label: "Время",
                value: time,
            },
            {
                iconClass: "bi-exclamation-circle",
                label: "Ошибки",
                value: `${getMistakesCount(item) ?? "-"}`,
            },
        );
    }

    return metrics;
};

interface ItemContentProps {
    item: TStudentNotification;
    closeModal: () => void;
}

const ItemContent = ({ item, closeModal }: ItemContentProps) => {
    const navigate = useNavigate();
    const isClickable = hasLink(item);
    const isAccessItem = isAccessNotification(item);
    const isSimpleTextItem = isSimpleTextNotification(item);
    const notificationMeta = getNotificationMeta(item);
    const notificationTitle = getNotificationTitle(item);
    const notificationSubtitle = getNotificationSubtitle(item);
    const metrics = getNotificationMetrics(item);

    const handleClick = () => {
        if (isClickable) {
            navigate(getLinkByName(item));
            closeModal();
        }
    };

    const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
        if (!isClickable) {
            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleClick();
        }
    };

    const content = isAccessItem ? (
        <>
            {item.type === "quizlet_assignment" ? (
                <>
                    Время тренировки!{" "}
                    <span className="notification__item-entity-name">
                        {item.quizlet_assignment?.title || "Задание Quizlet"}
                    </span>
                </>
            ) : item.type === "homework_assignment" ? (
                <>
                    Вам выдано задание{" "}
                    <span className="notification__item-entity-name">
                        {item.homework_assignment?.title || "Домашнее задание"}
                    </span>
                </>
            ) : (
                <>
                    Открыт доступ к <span className="notification__item-entity-name">{getLessonTitle(item)}</span>
                </>
            )}
        </>
    ) : item.type === "quizlet_personal_dictionary_topic_created" ? (
        <>
            Сэнсэй создала новый список слов{" "}
            <span className="notification__item-entity-name">{item.quizlet_dictionary_title}</span>
        </>
    ) : item.type === "quizlet_personal_dictionary_topic_updated" ? (
        <>
            Сэнсэй кое-что изменила в{" "}
            <span className="notification__item-entity-name">{item.quizlet_dictionary_title}</span>
        </>
    ) : item.type === "quizlet_personal_dictionary_topic_deleted" ? (
        <>
            Сэнсэй удалила <span className="notification__item-entity-name">{item.quizlet_dictionary_title}</span>
        </>
    ) : isSimpleTextItem ? (
        item.message || "Уведомление"
    ) : (
        getLessonTitle(item)
    );

    return (
        <div
            className={`notification__item notification__item--student ${notificationMeta.toneClass} ${item.viewed ? "viewed" : ""} ${
                isClickable ? "clickable" : ""
            }`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
        >
            <div className="notification__item-main">
                <div className="notification__item-header">
                    <div className="notification__item-title-group">
                        <div className="notification__item-badge" title={notificationMeta.label}>
                            <i className={`bi ${notificationMeta.iconClass}`} aria-hidden="true"></i>
                            <span>{notificationMeta.label}</span>
                        </div>
                        {!item.viewed ? <span className="notification__item-state">Новое</span> : null}
                    </div>
                    {isClickable ? (
                        <div className="notification__item-link-hint">
                            <span>Открыть</span>
                            <i className="bi bi-arrow-up-right" aria-hidden="true"></i>
                        </div>
                    ) : null}
                </div>

                <div className="notification__item-title-row">
                    <div className="notification__item-icon" aria-hidden="true">
                        <i className={`bi ${notificationMeta.iconClass}`}></i>
                    </div>
                    <div className="notification__item-title-block">
                        <div className="notification__item-title">{notificationTitle}</div>
                        <div className="notification__item-subtitle">
                            <span>{notificationSubtitle}</span>
                        </div>
                    </div>
                </div>

                <div className="notification__item-description">{content}</div>

                <div
                    className={`notification__item-metrics ${isAccessItem || isSimpleTextItem ? "notification__item-metrics--message" : ""}`}
                >
                    {metrics.map((metric) => (
                        <div
                            key={`${item.id}_${metric.label}`}
                            className="notification__item-metric"
                            title={metric.label}
                        >
                            <span className="notification__item-metric-icon" aria-hidden="true">
                                <i className={`bi ${metric.iconClass}`}></i>
                            </span>
                            <div className="notification__item-metric-text">
                                <span className="notification__item-metric-label">{metric.label}</span>
                                <span className="notification__item-metric-value">{metric.value}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
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
