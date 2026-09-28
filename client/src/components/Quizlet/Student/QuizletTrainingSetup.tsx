import { useState } from "react";

import {
    endQuizletSession,
    quizletKeys,
    quizletQueries,
    TQuizletCatalog,
    TQuizletPersonalDictionary,
} from "api/quizlet";
import { useStudentHubQuery } from "components/Notifications/useNotificationsHub";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import QuizletQuizStart, { type StartPayload } from "../QuizletQuizStart";

const formatSessionStartDateTime = (value: string): string => {
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

interface QuizletTrainingSetupProps {
    catalog: TQuizletCatalog;
    personal: TQuizletPersonalDictionary;
    onStart: (payload: StartPayload) => void;
    onContinue: (sessionId: number) => void;
    onHubChanged: () => void;
}

/** Выбор словарей и режима тренировки; сверху — незавершённая тренировка, если она есть. */
const QuizletTrainingSetup = ({ catalog, personal, onStart, onContinue, onHubChanged }: QuizletTrainingSetupProps) => {
    const queryClient = useQueryClient();
    const quizletAssignments = useStudentHubQuery().data?.quizletAssignments ?? [];
    const activeSessionQuery = useQuery(quizletQueries.activeSession());
    const [isFinishing, setIsFinishing] = useState(false);

    // Пока идёт перезапрос, прежние данные могут быть устаревшими — не показываем плашку.
    const activeSession =
        activeSessionQuery.isSuccess && !activeSessionQuery.isFetching ? activeSessionQuery.data : null;

    // Сессия по заданию, результат которого уже засчитан, продолжать не нужно.
    const relatedAssignment =
        activeSession?.assignment_id !== null && activeSession?.assignment_id !== undefined
            ? quizletAssignments.find((item) => item.assignment.id === activeSession.assignment_id)
            : undefined;
    const unfinishedSession =
        activeSession === null || activeSession.is_finished || (relatedAssignment?.result ?? null) !== null
            ? null
            : activeSession;

    const finishActiveSession = async () => {
        if (unfinishedSession === null || isFinishing) {
            return;
        }

        setIsFinishing(true);
        try {
            await endQuizletSession(unfinishedSession.id, true);
            onHubChanged();
            await queryClient.invalidateQueries({ queryKey: quizletKeys.activeSession() });
        } catch {
            return;
        } finally {
            setIsFinishing(false);
        }
    };

    return (
        <div className="mx-auto mt-5" style={{ maxWidth: "760px" }}>
            {unfinishedSession !== null && (
                <div className="alert alert-warning d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2">
                    <div>
                        <div className="fw-semibold mb-1">Есть незавершенная тренировка</div>
                        <div className="small">
                            Тип: {unfinishedSession.quiz_type === "flashcards" ? "Карточки" : "Пары"} • Прогресс:{" "}
                            {unfinishedSession.correct_answers}/{unfinishedSession.total_words}
                        </div>
                        <div className="small">Начало: {formatSessionStartDateTime(unfinishedSession.started_at)}</div>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            type="button"
                            className="btn btn-warning"
                            onClick={() => onContinue(unfinishedSession.id)}
                        >
                            Продолжить
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={finishActiveSession}
                            disabled={isFinishing}
                        >
                            {isFinishing ? "Завершение..." : "Завершить"}
                        </button>
                    </div>
                </div>
            )}
            <QuizletQuizStart
                groups={catalog.groups}
                subgroups={catalog.subgroups}
                subgroupWords={catalog.subgroup_words}
                words={catalog.words}
                personalLesson={personal.lesson}
                personalSubgroups={personal.subgroups}
                personalWords={personal.words}
                onStart={onStart}
            />
        </div>
    );
};

export default QuizletTrainingSetup;
