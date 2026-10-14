import { useNavigate } from "react-router-dom";

import { formatDuration } from "components/Quizlet/quizletUtils";
import { TTeacherNotification, TTeacherNotificationWithActivity } from "models/TNotification";

import { getQuizletTags, splitDateTime, TEACHER_ACTIVITY_TYPE_META, TeacherActivityMetric } from "./teacherActivity";
import TeacherActivityCard from "./TeacherActivityCard";

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

type TQuizletNotification = Extract<
    TTeacherNotificationWithActivity,
    { type: "quizlet_assignment_result" | "quizlet_session" }
>;

const isQuizletNotification = (item: TTeacherNotificationWithActivity): item is TQuizletNotification => {
    return item.type === "quizlet_assignment_result" || item.type === "quizlet_session";
};

const hasLink = (item: TTeacherNotificationWithActivity): boolean => {
    switch (item.type) {
        case "drilling_try":
        case "hieroglyph_try":
        case "quizlet_assignment_result":
        case "quizlet_session":
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
        case "quizlet_session":
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
    if (!isQuizletNotification(item) && item.type !== "homework_try") {
        return null;
    }

    const tryData = item.activity_try as Record<string, unknown>;
    return typeof tryData.correct_answers === "number" ? tryData.correct_answers : null;
};

const getSkippedWordsCount = (item: TTeacherNotificationWithActivity): number | null => {
    if (!isQuizletNotification(item)) {
        return null;
    }

    const tryData = item.activity_try as Record<string, unknown>;
    return typeof tryData.skipped_words === "number" ? tryData.skipped_words : null;
};

const getElapsedSeconds = (item: TTeacherNotificationWithActivity): number | null => {
    if (!isQuizletNotification(item) && item.type !== "homework_try") {
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

/** Заголовок карточки; у задания Quizlet — с числом выданных слов: «Повторение N4 (24)». */
const getNotificationTitle = (item: TTeacherNotificationWithActivity): string => {
    if (isQuizletNotification(item) && item.activity_try.total_words !== undefined) {
        return `${item.lesson.name} (${item.activity_try.total_words})`;
    }

    return item.lesson.name;
};

const getNotificationMetrics = (item: TTeacherNotificationWithActivity): TeacherActivityMetric[] => {
    const { date, time } = splitDateTime(item.creation_datetime);
    const startDateTime = getStartDateTime(item);
    const mistakesCount = getMistakesCount(item);
    const correctAnswersCount = getCorrectAnswersCount(item);
    const skippedWordsCount = getSkippedWordsCount(item);
    const elapsedSeconds = getElapsedSeconds(item);

    const metrics: TeacherActivityMetric[] = [
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

    // Первая строка — когда и сколько длилось, вторая — результат.
    if (isQuizletNotification(item) || item.type === "homework_try") {
        metrics.push(
            {
                iconClass: "bi-stopwatch",
                label: item.type === "homework_try" ? "Выполнение" : "Время",
                value: elapsedSeconds !== null ? formatDuration(elapsedSeconds) : "-",
            },
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

        if (isQuizletNotification(item)) {
            metrics.push({
                iconClass: "bi-dash-circle",
                label: "Пропущено",
                value: `${skippedWordsCount ?? "-"}`,
            });
        }

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
    const typeMeta = TEACHER_ACTIVITY_TYPE_META[isQuizletNotification(activityItem) ? "quizlet" : activityItem.type];
    const quizletTags = isQuizletNotification(activityItem)
        ? getQuizletTags(activityItem.activity_try.quiz_type, activityItem.activity_try.translation_direction)
        : [];
    if (activityItem.type === "quizlet_session") {
        quizletTags.unshift(activityItem.activity_try.is_assignment_retry ? "Повтор задания" : "Самостоятельно");
    }

    return (
        <TeacherActivityCard
            typeMeta={typeMeta}
            tags={quizletTags}
            state={item.viewed ? null : "Новое"}
            title={getNotificationTitle(activityItem)}
            studentLabel={`${activityItem.user.nickname} (${activityItem.user.name})`}
            metrics={getNotificationMetrics(activityItem)}
            viewed={item.viewed}
            onOpen={isClickable ? handleClick : undefined}
        />
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
