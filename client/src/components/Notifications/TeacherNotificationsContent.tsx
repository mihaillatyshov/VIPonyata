import type { KeyboardEventHandler } from "react";
import { useNavigate } from "react-router-dom";

import { formatDuration } from "components/Quizlet/quizletUtils";
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
        case "quizlet_assignment_result":
            return false;
        case "homework_try":
            return true;
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
        case "quizlet_assignment_result":
            return "";
        case "homework_try":
            return "tasks/tries";
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

const getCorrectAnswersCount = (item: TTeacherNotificationWithActivity): number | null => {
    if (item.type !== "quizlet_assignment_result" && item.type !== "homework_try") {
        return null;
    }

    const tryData = item.activity_try as Record<string, unknown>;
    return typeof tryData.correct_answers === "number" ? tryData.correct_answers : null;
};

const getSkippedWordsCount = (item: TTeacherNotificationWithActivity): number | null => {
    if (item.type !== "quizlet_assignment_result") {
        return null;
    }

    const tryData = item.activity_try as Record<string, unknown>;
    return typeof tryData.skipped_words === "number" ? tryData.skipped_words : null;
};

const getElapsedSeconds = (item: TTeacherNotificationWithActivity): number | null => {
    if (item.type !== "quizlet_assignment_result" && item.type !== "homework_try") {
        return null;
    }

    const tryData = item.activity_try as Record<string, unknown>;
    return typeof tryData.elapsed_seconds === "number" ? tryData.elapsed_seconds : null;
};

const getStartDateTime = (item: TTeacherNotificationWithActivity) => {
    const { start_datetime: startDatetime } = item.activity_try;

    if (typeof startDatetime !== "string" || startDatetime.length === 0) {
        return null;
    }

    return splitDateTime(startDatetime);
};

const getNotificationTypeMeta = (item: TTeacherNotificationWithActivity) => {
    switch (item.type) {
        case "drilling_try":
            return {
                label: "Лексика",
                iconClass: "bi-lightning-charge",
                toneClass: "notification__item--practice",
            };
        case "hieroglyph_try":
            return {
                label: "Кандзи",
                iconClass: "bi-pencil-square",
                toneClass: "notification__item--glyph",
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
        case "quizlet_assignment_result":
            return {
                label: "Quizlet",
                iconClass: "bi-collection",
                toneClass: "notification__item--quizlet",
            };
        case "homework_try":
            return {
                label: "Домашняя работа",
                iconClass: "bi-journal-check",
                toneClass: "notification__item--homework",
            };
    }
};

interface TeacherNotificationMetric {
    iconClass: string;
    label: string;
    value: string;
}

const getNotificationMetrics = (item: TTeacherNotificationWithActivity): TeacherNotificationMetric[] => {
    const { date, time } = splitDateTime(item.creation_datetime);
    const startDateTime = getStartDateTime(item);
    const mistakesCount = getMistakesCount(item);
    const correctAnswersCount = getCorrectAnswersCount(item);
    const skippedWordsCount = getSkippedWordsCount(item);
    const elapsedSeconds = getElapsedSeconds(item);

    const metrics: TeacherNotificationMetric[] = [
        {
            iconClass: "bi-calendar3",
            label: "Дата",
            value: date,
        },
    ];

    if (startDateTime?.time) {
        metrics.push({
            iconClass: "bi-play-circle",
            label: "Начало",
            value: startDateTime.time,
        });
    } else if (item.type !== "homework_try") {
        metrics.push({
            iconClass: "bi-clock",
            label: "Время",
            value: time,
        });
    }

    if (item.type === "quizlet_assignment_result" || item.type === "homework_try") {
        metrics.push(
            {
                iconClass: "bi-exclamation-circle",
                label: "Ошибки",
                value: `${mistakesCount ?? "-"}`,
            },
            {
                iconClass: "bi-check-circle",
                label: "Верно",
                value: `${correctAnswersCount ?? "-"}`,
            },
        );

        if (item.type === "quizlet_assignment_result") {
            metrics.push({
                iconClass: "bi-dash-circle",
                label: "Пропущено",
                value: `${skippedWordsCount ?? "-"}`,
            });
        }

        metrics.push({
            iconClass: "bi-stopwatch",
            label: item.type === "homework_try" ? "Выполнение" : "Время",
            value: elapsedSeconds !== null ? formatDuration(elapsedSeconds) : "-",
        });

        return metrics;
    }

    metrics.push({
        iconClass: "bi-exclamation-circle",
        label: "Ошибки",
        value: `${mistakesCount ?? "-"}`,
    });

    return metrics;
};

interface ItemContentProps {
    item: TTeacherNotification;
    closeModal: () => void;
}

const isTeacherActivityNotification = (item: TTeacherNotification): item is TTeacherNotificationWithActivity => {
    return item.type !== null && item.type !== undefined;
};

const ItemContent = ({ item, closeModal }: ItemContentProps) => {
    const navigate = useNavigate();

    const isPlainMessage = !isTeacherActivityNotification(item);

    const handleClick = () => {
        if (!isPlainMessage && hasLink(item)) {
            navigate(`/${getLinkByName(item)}/${item.activity_try_id}`);
            closeModal();
        }
    };

    const isClickable = !isPlainMessage && hasLink(item);
    const { date, time } = splitDateTime(item.creation_datetime);

    const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
        if (!isClickable) {
            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleClick();
        }
    };

    if (isPlainMessage) {
        return (
            <div
                className={`notification__item notification__item--teacher notification__item--message ${item.viewed ? "viewed" : ""}`}
            >
                <div className="notification__item-main">
                    <div className="notification__item-header">
                        <div className="notification__item-title-group">
                            <div className="notification__item-badge notification__item-badge--message">
                                <i className="bi bi-bell" aria-hidden="true"></i>
                                <span>Уведомление</span>
                            </div>
                            {!item.viewed ? <span className="notification__item-state">Новое</span> : null}
                        </div>
                        <div className="notification__item-title-row">
                            <div className="notification__item-icon" aria-hidden="true">
                                <i className="bi bi-chat-left-text"></i>
                            </div>
                            <div className="notification__item-title-block">
                                <div className="notification__item-title">Сообщение для учителя</div>
                                <div className="notification__item-subtitle">Системное уведомление</div>
                            </div>
                        </div>
                    </div>
                    <div className="notification__item-description">{item.message || "Уведомление"}</div>
                    <div className="notification__item-metrics notification__item-metrics--message">
                        <div className="notification__item-metric">
                            <span className="notification__item-metric-icon" aria-hidden="true">
                                <i className="bi bi-calendar3"></i>
                            </span>
                            <div className="notification__item-metric-text">
                                <span className="notification__item-metric-label">Дата</span>
                                <span className="notification__item-metric-value">{date}</span>
                            </div>
                        </div>
                        <div className="notification__item-metric">
                            <span className="notification__item-metric-icon" aria-hidden="true">
                                <i className="bi bi-clock"></i>
                            </span>
                            <div className="notification__item-metric-text">
                                <span className="notification__item-metric-label">Время</span>
                                <span className="notification__item-metric-value">{time}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const activityItem = item;

    const typeMeta = getNotificationTypeMeta(activityItem);
    const studentLabel = `${activityItem.user.nickname} (${activityItem.user.name})`;
    const metrics = getNotificationMetrics(activityItem);

    return (
        <div
            className={`notification__item notification__item--teacher ${typeMeta.toneClass} ${item.viewed ? "viewed" : ""} ${isClickable ? "clickable" : ""}`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
        >
            <div className="notification__item-main">
                <div className="notification__item-header">
                    <div className="notification__item-title-group">
                        <div className="notification__item-badge" title={typeMeta.label}>
                            <i className={`bi ${typeMeta.iconClass}`} aria-hidden="true"></i>
                            <span>{typeMeta.label}</span>
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
                        <i className={`bi ${typeMeta.iconClass}`}></i>
                    </div>
                    <div className="notification__item-title-block">
                        <div className="notification__item-title">{activityItem.lesson.name}</div>
                        <div className="notification__item-subtitle" title={studentLabel}>
                            <i className="bi bi-person" aria-hidden="true"></i>
                            <span>{studentLabel}</span>
                        </div>
                    </div>
                </div>

                <div className="notification__item-metrics">
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
