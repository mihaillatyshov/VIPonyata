import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { getTaskLessonRoute, TaskLessonCardItem } from "./tasksUtils";

const LessonThumb = ({ img }: { img?: string | null }) => (
    <div className="tasks-lesson-card__thumb-wrap">
        {img ? (
            <img className="tasks-lesson-card__thumb" src={img} alt="" />
        ) : (
            <div className="tasks-lesson-card__thumb tasks-lesson-card__thumb--placeholder">
                <i className="bi bi-image" />
            </div>
        )}
    </div>
);

interface TaskBankLessonCardsProps {
    lessonCards: TaskLessonCardItem[];
    processingLessonId: number | null;
    onSetLessonHidden: (lessonId: number, hidden: boolean) => Promise<boolean>;
}

/** Банк заданий: карточки уроков, скрытие урока (с подтверждением) и список скрытых уроков. */
const TaskBankLessonCards = ({ lessonCards, processingLessonId, onSetLessonHidden }: TaskBankLessonCardsProps) => {
    const navigate = useNavigate();
    const [showHiddenLessons, setShowHiddenLessons] = useState(false);
    const [confirmHideLessonId, setConfirmHideLessonId] = useState<number | null>(null);

    const visibleCards = lessonCards.filter((item) => !item.isHidden);
    const hiddenCards = lessonCards.filter((item) => item.isHidden);

    const hideLesson = async (lessonId: number) => {
        if (await onSetLessonHidden(lessonId, true)) {
            setConfirmHideLessonId(null);
        }
    };

    return (
        <>
            {hiddenCards.length > 0 ? (
                <div className="d-flex justify-content-end mb-3">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setShowHiddenLessons((prev) => !prev)}
                    >
                        {showHiddenLessons
                            ? `Скрыть скрытые уроки (${hiddenCards.length})`
                            : `Показать скрытые уроки (${hiddenCards.length})`}
                    </button>
                </div>
            ) : null}
            <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-3 g-3">
                {visibleCards.map((lessonCard) => (
                    <div className="col" key={lessonCard.key}>
                        <div className="card quizlet-topic-card tasks-lesson-card h-100">
                            {lessonCard.lesson_id !== null ? (
                                <div className="tasks-lesson-card__actions">
                                    {confirmHideLessonId === lessonCard.lesson_id ? (
                                        <div className="tasks-lesson-card__confirm-actions">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-danger tasks-lesson-card__confirm-btn"
                                                disabled={processingLessonId === lessonCard.lesson_id}
                                                onClick={() => hideLesson(lessonCard.lesson_id as number)}
                                            >
                                                Да
                                            </button>
                                            <button
                                                type="button"
                                                className="tasks-lesson-card__hide-btn"
                                                aria-label="Отмена"
                                                title="Отмена"
                                                onClick={() => setConfirmHideLessonId(null)}
                                            >
                                                <i className="bi bi-x" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className="tasks-lesson-card__hide-btn"
                                            aria-label="Скрыть урок"
                                            title="Скрыть урок"
                                            onClick={() => setConfirmHideLessonId(lessonCard.lesson_id)}
                                        >
                                            <i className="bi bi-x" />
                                        </button>
                                    )}
                                </div>
                            ) : null}
                            <button
                                type="button"
                                className="tasks-lesson-card__content w-100 text-start"
                                onClick={() => navigate(getTaskLessonRoute(lessonCard.lesson_id))}
                            >
                                <div className="card-body d-flex flex-column gap-3 tasks-lesson-card__body">
                                    <div className="d-flex justify-content-between gap-3 align-items-start">
                                        <div>
                                            <div className="quizlet-topic-card__title fw-semibold">
                                                {lessonCard.title}
                                            </div>
                                            <div className="quizlet-topic-card__count text-muted mt-1">
                                                <i className="bi bi-ui-checks-grid me-1" />
                                                {lessonCard.items.length} заданий
                                                <span className="mx-2">•</span>
                                                <i className="bi bi-distribute-horizontal me-1" />
                                                {lessonCard.blocksCount} блоков
                                            </div>
                                        </div>
                                        <LessonThumb img={lessonCard.img} />
                                    </div>
                                    {lessonCard.lesson_id === null ? (
                                        <div className="small text-muted">задания без урока</div>
                                    ) : null}
                                </div>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {showHiddenLessons && hiddenCards.length > 0 ? (
                <div className="mt-4">
                    <div className="tasks-group-title">Скрытые уроки</div>
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-3 g-3">
                        {hiddenCards.map((lessonCard) => (
                            <div className="col" key={lessonCard.key}>
                                <div className="card quizlet-topic-card tasks-lesson-card tasks-lesson-card--hidden h-100">
                                    <div className="card-body d-flex flex-column gap-3">
                                        <div className="d-flex justify-content-between gap-3 align-items-start">
                                            <div>
                                                <div className="quizlet-topic-card__title fw-semibold">
                                                    {lessonCard.title}
                                                </div>
                                                <div className="quizlet-topic-card__count text-muted mt-1">
                                                    <i className="bi bi-ui-checks-grid me-1" />
                                                    {lessonCard.items.length} заданий
                                                </div>
                                            </div>
                                            <LessonThumb img={lessonCard.img} />
                                        </div>
                                        <div className="d-flex justify-content-end">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary"
                                                disabled={processingLessonId === lessonCard.lesson_id}
                                                onClick={() => onSetLessonHidden(lessonCard.lesson_id as number, false)}
                                            >
                                                Вернуть
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </>
    );
};

export default TaskBankLessonCards;
