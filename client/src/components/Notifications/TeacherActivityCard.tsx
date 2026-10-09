import type { KeyboardEventHandler } from "react";

import { TeacherActivityMetric, TeacherActivityTypeMeta } from "./teacherActivity";

/** Общая карточка действия ученика: уведомления учителя и страница истории (teacher/history). */

interface TeacherActivityCardProps {
    typeMeta: TeacherActivityTypeMeta;
    tags?: string[];
    /** Жёлтая плашка рядом с тегами: «Новое», «Не завершено». */
    state?: string | null;
    title: string;
    studentLabel: string;
    /** Дополнительная строка под заголовком (темы словаря, действие). */
    details?: { iconClass: string; text: string } | null;
    metrics: TeacherActivityMetric[];
    viewed?: boolean;
    onOpen?: () => void;
}

const TeacherActivityCard = ({
    typeMeta,
    tags = [],
    state,
    title,
    studentLabel,
    details,
    metrics,
    viewed = false,
    onOpen,
}: TeacherActivityCardProps) => {
    const isClickable = onOpen !== undefined;

    const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
        if (!isClickable) {
            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen();
        }
    };

    return (
        <div
            className={`notification__item notification__item--teacher ${typeMeta.toneClass} ${viewed ? "viewed" : ""} ${isClickable ? "clickable" : ""}`}
            onClick={onOpen}
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
                        {tags.map((tag) => (
                            <div key={tag} className="notification__item-badge">
                                <span>{tag}</span>
                            </div>
                        ))}
                        {state ? <span className="notification__item-state">{state}</span> : null}
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
                        <div className="notification__item-title">{title}</div>
                        <div className="notification__item-subtitle" title={studentLabel}>
                            <i className="bi bi-person" aria-hidden="true"></i>
                            <span>{studentLabel}</span>
                        </div>
                        {details ? (
                            <div className="notification__item-subtitle" title={details.text}>
                                <i className={`bi ${details.iconClass}`} aria-hidden="true"></i>
                                <span>{details.text}</span>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="notification__item-metrics">
                    {metrics.map((metric) => (
                        <div key={metric.label} className="notification__item-metric" title={metric.label}>
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

export default TeacherActivityCard;
