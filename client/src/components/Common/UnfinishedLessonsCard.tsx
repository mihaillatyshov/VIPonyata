import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { AjaxPost } from "libs/ServerAPI";
import { TUnfinishedLessonItem, TUnfinishedLessonsSummary } from "models/TLesson";

interface UnfinishedLessonsCardProps {
    summary: TUnfinishedLessonsSummary | undefined;
    onChanged?: () => void;
}

const formatStartDateTime = (value: string | null): string => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

const getActivityPath = (activityType: string, activityId: number): string | null => {
    if (activityType === "drilling") {
        return `/drilling/${activityId}`;
    }
    if (activityType === "hieroglyph") {
        return `/hieroglyph/${activityId}`;
    }
    if (activityType === "assessment") {
        return `/assessment/${activityId}`;
    }
    return null;
};

const UnfinishedLessonsCard = ({ summary, onChanged }: UnfinishedLessonsCardProps) => {
    const navigate = useNavigate();
    const [isFinishing, setIsFinishing] = useState(false);

    if (summary === undefined || !summary.has_unfinished_lessons) {
        return null;
    }

    const items: TUnfinishedLessonItem[] =
        summary.items && summary.items.length > 0
            ? summary.items
            : summary.next_unfinished_activity_type !== null &&
              summary.next_unfinished_activity_id !== null &&
              summary.next_unfinished_activity_started_at !== null
            ? [
                  {
                      course_name: summary.next_unfinished_course_name ?? "-",
                      lesson_id: summary.next_unfinished_lesson_id ?? 0,
                      lesson_name: summary.next_unfinished_lesson_name ?? "-",
                      activity_type: summary.next_unfinished_activity_type,
                      activity_id: summary.next_unfinished_activity_id,
                      activity_started_at: summary.next_unfinished_activity_started_at,
                  },
              ]
            : [];

    const continueUnfinished = (item: TUnfinishedLessonItem) => {
        const activityType = item.activity_type;
        const activityId = item.activity_id;
        const path = getActivityPath(activityType, activityId);
        if (!path) {
            return;
        }

        AjaxPost({ url: `/api/${activityType}/${activityId}/continuetry` })
            .then(() => {
                navigate(path);
            })
            .catch(() => {
                // No-op: keep current page and allow retry.
            });
    };

    const finishUnfinished = (item: TUnfinishedLessonItem) => {
        if (isFinishing) {
            return;
        }

        setIsFinishing(true);
        AjaxPost({
            url: "/api/activities/unfinished/end",
            body: {
                activity_type: item.activity_type,
                activity_id: item.activity_id,
            },
        })
            .then(() => {
                if (onChanged) {
                    onChanged();
                }
            })
            .finally(() => {
                setIsFinishing(false);
            });
    };

    return (
        <>
            {items.map((item) => (
                <div
                    key={`${item.activity_type}-${item.activity_id}`}
                    className="alert alert-warning d-flex flex-column align-items-start gap-1 mb-4 mx-auto"
                    style={{ width: "min(100%, 520px)" }}
                >
                    <div className="text-start w-100">
                        <div className="fw-semibold mb-0">Урок не завершен</div>
                        <div className="small">Курс: {item.course_name}</div>
                        <div className="small">Урок: {item.lesson_name}</div>
                        <div className="small">Начало: {formatStartDateTime(item.activity_started_at)}</div>
                    </div>
                    <div className="d-flex gap-2 flex-wrap justify-content-end w-100">
                        <button
                            type="button"
                            className="btn btn-warning"
                            onClick={() => continueUnfinished(item)}
                            disabled={isFinishing}
                        >
                            Продолжить
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => finishUnfinished(item)}
                            disabled={isFinishing}
                        >
                            {isFinishing ? "Завершение..." : "Завершить"}
                        </button>
                    </div>
                </div>
            ))}
        </>
    );
};

export default UnfinishedLessonsCard;
