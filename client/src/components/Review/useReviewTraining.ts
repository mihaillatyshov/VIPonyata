import { useEffect, useMemo, useState } from "react";

import { reviewKeys, saveReviewTrainingResults, setReviewWordFrozen, TReviewCatalog } from "api/review";
import { ReviewTrainingHistoryEntry } from "components/Review/ReviewTrainingHistory";
import { TReviewWord } from "models/TReview";

import { useQueryClient } from "@tanstack/react-query";

import { ReviewSetupState } from "./reviewSetupReducer";
import {
    dedupeReviewTrainingHistoryEntries,
    getTrainingIncorrectAnswers,
    getTrainingResultForWord,
    getTrainingResultSummary,
    insertWordLater,
    isReviewTrainingHistoryEntry,
    isTrainingSessionValue,
    mergeUpdatedWords,
    pickRandomWordIds,
    pickSmartRandomWordIds,
    REVIEW_ACTIVE_TRAINING_STORAGE_KEY,
    REVIEW_TRAINING_HISTORY_LIMIT,
    REVIEW_TRAINING_HISTORY_STORAGE_KEY,
    ReviewTrainingMode,
    ReviewTrainingResult,
    sanitizeTrainingSession,
    shuffleArray,
    stopSpeaking,
    TrainingAssessment,
    TrainingSession,
} from "./reviewTraining";

const readTrainingHistory = (): { entries: ReviewTrainingHistoryEntry[]; hasError: boolean } => {
    try {
        const rawValue = window.localStorage.getItem(REVIEW_TRAINING_HISTORY_STORAGE_KEY);
        if (rawValue === null) {
            return { entries: [], hasError: false };
        }

        const parsedValue = JSON.parse(rawValue);
        if (!Array.isArray(parsedValue)) {
            throw new Error("History payload is not an array");
        }

        const entries = dedupeReviewTrainingHistoryEntries(parsedValue.filter(isReviewTrainingHistoryEntry));
        if (entries.length !== parsedValue.length) {
            window.localStorage.setItem(REVIEW_TRAINING_HISTORY_STORAGE_KEY, JSON.stringify(entries));
        }

        return { entries, hasError: false };
    } catch {
        return { entries: [], hasError: true };
    }
};

/** Незавершённая тренировка из localStorage, очищенная от удалённых слов/топиков. */
const readSavedTrainingSession = (catalog: TReviewCatalog): { session: TrainingSession | null; hasError: boolean } => {
    try {
        const rawValue = window.localStorage.getItem(REVIEW_ACTIVE_TRAINING_STORAGE_KEY);
        if (rawValue === null) {
            return { session: null, hasError: false };
        }

        const parsedValue = JSON.parse(rawValue);
        if (!isTrainingSessionValue(parsedValue)) {
            throw new Error("Saved training payload is invalid");
        }

        const session = sanitizeTrainingSession(parsedValue, catalog.words, catalog.topics);
        if (session === null || session.isFinished) {
            window.localStorage.removeItem(REVIEW_ACTIVE_TRAINING_STORAGE_KEY);
            return { session: null, hasError: false };
        }

        if (JSON.stringify(session) !== rawValue) {
            window.localStorage.setItem(REVIEW_ACTIVE_TRAINING_STORAGE_KEY, JSON.stringify(session));
        }

        return { session, hasError: false };
    } catch {
        return { session: null, hasError: true };
    }
};

/**
 * Тренировка повторения (без сервера: сессия и история — в localStorage).
 * По окончании результаты отправляются на сервер, чтобы обновить статусы слов.
 */
export const useReviewTraining = (catalog: TReviewCatalog, setup: ReviewSetupState) => {
    const queryClient = useQueryClient();
    const { words, topics } = catalog;

    const [trainingSession, setTrainingSession] = useState<TrainingSession | null>(null);
    const [savedTrainingSession, setSavedTrainingSession] = useState<TrainingSession | null>(null);
    const [hasSavedTrainingSessionError, setHasSavedTrainingSessionError] = useState(false);
    const [trainingHistory, setTrainingHistory] = useState(readTrainingHistory);
    const [memoryStateError, setMemoryStateError] = useState<string | null>(null);
    const [isUpdatingWordMemoryState, setIsUpdatingWordMemoryState] = useState(false);

    const wordsById = useMemo(() => new Map(words.map((word) => [word.id, word])), [words]);
    const currentWord =
        trainingSession === null || trainingSession.queue.length === 0
            ? null
            : (wordsById.get(trainingSession.queue[0]) ?? null);

    const updateCatalogWords = (updatedWords: TReviewWord[]) => {
        queryClient.setQueryData<TReviewCatalog>(reviewKeys.catalog(), (prev) =>
            prev === undefined ? prev : { ...prev, words: mergeUpdatedWords(prev.words, updatedWords) },
        );
    };

    const clearStoredActiveSession = () => {
        try {
            window.localStorage.removeItem(REVIEW_ACTIVE_TRAINING_STORAGE_KEY);
            setHasSavedTrainingSessionError(false);
        } catch {
            setHasSavedTrainingSessionError(true);
        }
        setSavedTrainingSession(null);
    };

    // Пока тренировки нет — предлагаем продолжить сохранённую.
    useEffect(() => {
        if (trainingSession !== null) {
            return;
        }

        const saved = readSavedTrainingSession(catalog);
        setSavedTrainingSession(saved.session);
        if (saved.hasError) {
            setHasSavedTrainingSessionError(true);
        } else if (saved.session !== null) {
            setHasSavedTrainingSessionError(false);
        }
    }, [catalog, trainingSession]);

    // Идущая тренировка сохраняется после каждого ответа.
    useEffect(() => {
        if (trainingSession === null) {
            return;
        }

        if (trainingSession.isFinished) {
            clearStoredActiveSession();
            return;
        }

        try {
            window.localStorage.setItem(REVIEW_ACTIVE_TRAINING_STORAGE_KEY, JSON.stringify(trainingSession));
            setSavedTrainingSession(trainingSession);
            setHasSavedTrainingSessionError(false);
        } catch {
            setHasSavedTrainingSessionError(true);
        }
    }, [trainingSession]);

    const persistTrainingHistory = (entry: ReviewTrainingHistoryEntry) => {
        setTrainingHistory((prev) => {
            const entries = dedupeReviewTrainingHistoryEntries([entry, ...prev.entries]).slice(
                0,
                REVIEW_TRAINING_HISTORY_LIMIT,
            );

            try {
                window.localStorage.setItem(REVIEW_TRAINING_HISTORY_STORAGE_KEY, JSON.stringify(entries));
                return { entries, hasError: false };
            } catch {
                return { entries, hasError: true };
            }
        });
    };

    const syncTrainingMemoryStates = (session: TrainingSession) => {
        const results = session.initialWordIds
            .map((wordId) => {
                const result = getTrainingResultForWord(session, wordId);
                return result === null ? null : { word_id: wordId, result };
            })
            .filter((item): item is { word_id: number; result: ReviewTrainingResult } => item !== null);

        if (results.length === 0) {
            return;
        }

        saveReviewTrainingResults(results)
            .then((json) => {
                updateCatalogWords(json.words);
                setMemoryStateError(null);
            })
            .catch(() => {
                setMemoryStateError("Не удалось обновить статусы слов после тренировки");
            });
    };

    const startTraining = (
        wordIds?: number[],
        allWordIds?: number[],
        topicIds?: number[],
        mode: ReviewTrainingMode = setup.mode,
    ) => {
        const selectedWordIds =
            wordIds ?? words.filter((word) => setup.selectedTopicIds.includes(word.topic_id)).map((word) => word.id);
        const sessionTopicIds =
            topicIds ??
            Array.from(new Set(words.filter((word) => selectedWordIds.includes(word.id)).map((word) => word.topic_id)));

        if (selectedWordIds.length === 0) {
            return;
        }

        stopSpeaking();
        setMemoryStateError(null);
        setTrainingSession({
            allWordIds: [...(allWordIds ?? selectedWordIds)],
            initialWordIds: [...selectedWordIds],
            topicIds: [...sessionTopicIds],
            queue: shuffleArray(selectedWordIds),
            openedWordIds: [],
            mode,
            direction: setup.direction,
            assessments: {},
            startedAt: Date.now(),
            elapsedSeconds: 0,
            isFinished: false,
        });
    };

    const startConfiguredTraining = () => {
        if (setup.mode === "topics") {
            startTraining();
            return;
        }

        const availableWords = words.filter((word) => !word.is_frozen);
        const selectedWordIds =
            setup.mode === "random"
                ? pickRandomWordIds(availableWords, setup.randomCount)
                : pickSmartRandomWordIds(availableWords, setup.randomCount);

        startTraining(
            selectedWordIds,
            selectedWordIds,
            Array.from(
                new Set(
                    availableWords.filter((word) => selectedWordIds.includes(word.id)).map((word) => word.topic_id),
                ),
            ),
            setup.mode,
        );
    };

    const finalizeTrainingSession = (
        sessionToFinish: TrainingSession,
        nextQueue: number[],
        nextAssessments: Record<number, TrainingAssessment>,
    ) => {
        stopSpeaking();
        const finishedAt = Date.now();
        const finishedSession: TrainingSession = {
            ...sessionToFinish,
            queue: nextQueue,
            assessments: nextAssessments,
            elapsedSeconds: Math.floor((finishedAt - sessionToFinish.startedAt) / 1000),
            isFinished: true,
        };
        const summary = getTrainingResultSummary(finishedSession);
        const topicTitleById = new Map(topics.map((topic) => [topic.id, topic.title]));

        persistTrainingHistory({
            id: `${finishedSession.startedAt}_${Math.random().toString(36).slice(2, 10)}`,
            startedAt: finishedSession.startedAt,
            endedAt: finishedAt,
            elapsedSeconds: finishedSession.elapsedSeconds,
            reviewedWords: finishedSession.initialWordIds.length - summary.notReviewed,
            skippedWords: summary.notReviewed,
            incorrectAnswers: getTrainingIncorrectAnswers(finishedSession),
            totalWords: finishedSession.initialWordIds.length,
            direction: finishedSession.direction,
            easyCount: summary.easy,
            partialCount: summary.partial,
            forgotCount: summary.forgot,
            topicTitles: finishedSession.topicIds
                .map((topicId) => topicTitleById.get(topicId))
                .filter((topicTitle): topicTitle is string => Boolean(topicTitle)),
        });
        syncTrainingMemoryStates(finishedSession);
        clearStoredActiveSession();
        setTrainingSession(finishedSession);
    };

    const finishCurrentTraining = () => {
        if (trainingSession === null || trainingSession.isFinished) {
            return;
        }

        finalizeTrainingSession(trainingSession, trainingSession.queue, trainingSession.assessments);
    };

    const continueSavedTraining = () => {
        if (savedTrainingSession === null || savedTrainingSession.isFinished) {
            return;
        }

        stopSpeaking();
        setMemoryStateError(null);
        setTrainingSession(savedTrainingSession);
    };

    const finishSavedTraining = () => {
        if (savedTrainingSession === null || savedTrainingSession.isFinished) {
            return;
        }

        finalizeTrainingSession(savedTrainingSession, savedTrainingSession.queue, savedTrainingSession.assessments);
    };

    /** Слово перевёрнуто — считается повторённым. */
    const revealCurrentWord = () => {
        if (currentWord === null) {
            return;
        }

        setTrainingSession((prev) =>
            prev === null || prev.openedWordIds.includes(currentWord.id)
                ? prev
                : { ...prev, openedWordIds: [...prev.openedWordIds, currentWord.id] },
        );
    };

    const answerCurrentWord = (grade: ReviewTrainingResult) => {
        if (trainingSession === null || trainingSession.isFinished || currentWord === null) {
            return;
        }

        const currentWordId = currentWord.id;
        const queueWithoutCurrent = trainingSession.queue.slice(1);
        const currentAssessment = trainingSession.assessments[currentWordId] ?? { forgot: 0, partial: 0, remember: 0 };
        const nextAssessments = {
            ...trainingSession.assessments,
            [currentWordId]: { ...currentAssessment, [grade]: currentAssessment[grade] + 1 },
        };
        // «Не помню» и «частично» возвращают слово в очередь позже.
        const nextQueue =
            grade === "remember" ? queueWithoutCurrent : insertWordLater(queueWithoutCurrent, currentWordId, 1);

        if (nextQueue.length === 0) {
            finalizeTrainingSession(trainingSession, nextQueue, nextAssessments);
            return;
        }

        setTrainingSession((prev) =>
            prev === null ? prev : { ...prev, queue: nextQueue, assessments: nextAssessments },
        );
    };

    const resetTraining = () => {
        stopSpeaking();
        clearStoredActiveSession();
        setTrainingSession(null);
        setMemoryStateError(null);
    };

    const repeatAll = () => {
        if (trainingSession !== null) {
            startTraining(trainingSession.allWordIds, trainingSession.allWordIds, trainingSession.topicIds);
        }
    };

    const repeatForgotten = () => {
        if (trainingSession === null) {
            return;
        }

        const forgottenWordIds = trainingSession.initialWordIds.filter((wordId) => {
            if (!trainingSession.openedWordIds.includes(wordId)) {
                return true;
            }
            const assessment = trainingSession.assessments[wordId];
            return assessment !== undefined && (assessment.forgot > 0 || assessment.partial > 0);
        });

        if (forgottenWordIds.length > 0) {
            startTraining(forgottenWordIds, trainingSession.allWordIds, trainingSession.topicIds);
        }
    };

    const toggleCurrentWordFrozen = async () => {
        if (currentWord === null || isUpdatingWordMemoryState) {
            return;
        }

        setIsUpdatingWordMemoryState(true);
        try {
            const json = await setReviewWordFrozen(currentWord.id, !currentWord.is_frozen);
            updateCatalogWords([json.word]);
            setMemoryStateError(null);
        } catch {
            setMemoryStateError("Не удалось изменить состояние заморозки слова");
        } finally {
            setIsUpdatingWordMemoryState(false);
        }
    };

    return {
        trainingSession,
        currentWord,
        savedTrainingSession,
        hasSavedTrainingSessionError,
        trainingHistory: trainingHistory.entries,
        hasTrainingHistoryError: trainingHistory.hasError,
        memoryStateError,
        isUpdatingWordMemoryState,
        startConfiguredTraining,
        finishCurrentTraining,
        continueSavedTraining,
        finishSavedTraining,
        revealCurrentWord,
        answerCurrentWord,
        resetTraining,
        repeatAll,
        repeatForgotten,
        toggleCurrentWordFrozen,
    };
};

export type ReviewTrainingState = ReturnType<typeof useReviewTraining>;
