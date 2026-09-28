import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    endQuizletSession,
    markQuizletFlashcardViewed,
    quizletKeys,
    quizletQueries,
    retryQuizletSession,
    saveQuizletSessionProgress,
    startQuizletAssignmentSession,
    startQuizletSession,
    submitQuizletFlashcardAnswer,
    submitQuizletPairAttempt,
    TQuizletSessionDetails,
    TQuizletSessionWithQueue,
} from "api/quizlet";
import { getApiErrorMessage } from "libs/ServerAPI";
import { TQuizletSessionWord } from "models/TQuizlet";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { type StartPayload } from "../QuizletQuizStart";
import { parseQueue, shuffleArray } from "../quizletUtils";
import { studentQuizletPaths } from "./studentQuizletRoutes";

const EMPTY_WORDS: TQuizletSessionWord[] = [];
const PROGRESS_SAVE_INTERVAL_MS = 10_000;

const getFlashcardAutoSpeakStorageKey = (sessionId: number) => `quizlet.flashcards.autoSpeakAfterFlip.${sessionId}`;

const readFlashcardAutoSpeakSetting = (sessionId: number): boolean => {
    try {
        return window.sessionStorage.getItem(getFlashcardAutoSpeakStorageKey(sessionId)) === "1";
    } catch {
        return false;
    }
};

const writeFlashcardAutoSpeakSetting = (sessionId: number, enabled: boolean) => {
    try {
        window.sessionStorage.setItem(getFlashcardAutoSpeakStorageKey(sessionId), enabled ? "1" : "0");
    } catch {
        return;
    }
};

/** Очередь сессии: сохранённая сервером (без чужих id) или все неотвеченные слова. */
const getSessionQueue = (session: TQuizletSessionWithQueue, words: TQuizletSessionWord[]) => {
    const validWordIds = new Set(words.map((word) => word.id));
    const persistedQueue = parseQueue(session).filter((wordId) => validWordIds.has(wordId));
    return persistedQueue.length > 0 ? persistedQueue : words.filter((word) => !word.is_correct).map((word) => word.id);
};

const shuffleSessionQueue = (details: TQuizletSessionDetails): TQuizletSessionDetails => {
    const validWordIds = new Set(details.words.map((word) => word.id));
    const persistedQueue = parseQueue(details.session).filter((wordId) => validWordIds.has(wordId));
    const initialQueue = persistedQueue.length > 0 ? persistedQueue : details.words.map((word) => word.id);

    return {
        ...details,
        session: { ...details.session, queue_state: JSON.stringify(shuffleArray(initialQueue)) },
    };
};

/** Секундомер сессии: стартует с серверного `elapsed_seconds` и тикает локально, пока сессия не завершена. */
const useLiveElapsedSeconds = (session: TQuizletSessionWithQueue | null) => {
    const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0);
    const timerSessionIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (session === null) {
            timerSessionIdRef.current = null;
            setLiveElapsedSeconds(0);
            return;
        }

        if (timerSessionIdRef.current !== session.id) {
            timerSessionIdRef.current = session.id;
            setLiveElapsedSeconds(session.elapsed_seconds);
            return;
        }

        if (session.is_finished) {
            setLiveElapsedSeconds(session.elapsed_seconds);
            return;
        }

        setLiveElapsedSeconds((prev) => Math.max(prev, session.elapsed_seconds));
    }, [session]);

    const sessionId = session?.id;
    const isFinished = session?.is_finished ?? true;

    useEffect(() => {
        if (sessionId === undefined || isFinished) {
            return;
        }

        const intervalId = window.setInterval(() => setLiveElapsedSeconds((prev) => prev + 1), 1000);
        return () => window.clearInterval(intervalId);
    }, [sessionId, isFinished]);

    return liveElapsedSeconds;
};

/** Сохраняет очередь на сервере раз в 10 с бездействия, при уходе со страницы и при сворачивании вкладки. */
const useSessionProgressAutosave = (session: TQuizletSessionWithQueue | null, queue: number[]) => {
    const queueRef = useRef<number[]>(queue);

    useEffect(() => {
        queueRef.current = queue;
    }, [queue]);

    useEffect(() => {
        if (session === null || session.is_finished) {
            return;
        }

        const intervalId = setInterval(() => {
            saveQuizletSessionProgress(session.id, queue).catch(() => undefined);
        }, PROGRESS_SAVE_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [session, queue]);

    const sessionId = session?.id;
    const isFinished = session?.is_finished ?? true;

    useEffect(() => {
        if (sessionId === undefined || isFinished) {
            return;
        }

        const persistProgress = () => {
            saveQuizletSessionProgress(sessionId, queueRef.current).catch(() => undefined);
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                persistProgress();
            }
        };

        window.addEventListener("pagehide", persistProgress);
        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            persistProgress();
            window.removeEventListener("pagehide", persistProgress);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, [sessionId, isFinished]);
};

/**
 * Текущая тренировка ученика. Данные сессии лежат в кеше TanStack Query (`quizletKeys.session(id)`);
 * после каждого действия сессия перезапрашивается, более ранний незавершённый запрос при этом отменяется.
 * `onHubChanged` — обновить данные главной (статистика, задания), когда сессия завершилась или начата по заданию.
 */
export const useQuizletSession = (onHubChanged: () => void) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [sessionId, setSessionId] = useState<number | null>(null);
    const [autoSpeakAfterFlip, setAutoSpeakAfterFlip] = useState(false);
    const autoFinishSessionIdRef = useRef<number | null>(null);
    const loadRequestIdRef = useRef(0);
    const viewedFlashcardIdsRef = useRef<Set<number>>(new Set());

    // staleTime: Infinity — сессию перезапрашивают только явные действия (loadSession/refreshSession).
    const sessionQuery = useQuery({
        ...quizletQueries.session(sessionId ?? 0),
        enabled: sessionId !== null,
        staleTime: Infinity,
    });
    const details = sessionId === null ? undefined : sessionQuery.data;
    const session = details?.session ?? null;
    const sessionWords = details?.words ?? EMPTY_WORDS;

    const queue = useMemo(
        () => (session === null ? [] : getSessionQueue(session, sessionWords)),
        [session, sessionWords],
    );

    const orderedSessionWords = useMemo(() => {
        const queuePositionByWordId = new Map<number, number>(queue.map((wordId, index) => [wordId, index]));

        return [...sessionWords].sort((left, right) => {
            const leftPosition = queuePositionByWordId.get(left.id);
            const rightPosition = queuePositionByWordId.get(right.id);

            if (leftPosition !== undefined && rightPosition !== undefined) {
                return leftPosition - rightPosition;
            }
            if (leftPosition !== undefined) {
                return -1;
            }
            if (rightPosition !== undefined) {
                return 1;
            }
            return left.id - right.id;
        });
    }, [sessionWords, queue]);

    const unresolvedCount = sessionWords.filter((word) => !word.is_correct).length;
    const liveElapsedSeconds = useLiveElapsedSeconds(session);
    useSessionProgressAutosave(session, queue);

    /** Загрузить сессию с сервера и сделать её текущей. Ответ устаревшего вызова игнорируется. */
    const loadSession = async (nextSessionId: number, shuffleQueue = false) => {
        const requestId = ++loadRequestIdRef.current;
        try {
            let nextDetails = await queryClient.fetchQuery({ ...quizletQueries.session(nextSessionId), staleTime: 0 });
            if (shuffleQueue && !nextDetails.session.is_finished) {
                nextDetails = shuffleSessionQueue(nextDetails);
                queryClient.setQueryData(quizletKeys.session(nextSessionId), nextDetails);
            }

            if (requestId !== loadRequestIdRef.current) {
                return;
            }
            setAutoSpeakAfterFlip(
                nextDetails.session.quiz_type === "flashcards" ? readFlashcardAutoSpeakSetting(nextSessionId) : false,
            );
            setSessionId(nextSessionId);
        } catch {
            if (requestId !== loadRequestIdRef.current) {
                return;
            }
            setAutoSpeakAfterFlip(false);
            setSessionId(null);
        }
    };

    const refreshSession = (targetSessionId: number) =>
        queryClient.invalidateQueries({ queryKey: quizletKeys.session(targetSessionId), exact: true });

    const finishSessionAutomatically = useEffectEvent((targetSessionId: number) => {
        endQuizletSession(targetSessionId, false)
            .then(() => {
                onHubChanged();
                refreshSession(targetSessionId);
            })
            .catch(() => {
                autoFinishSessionIdRef.current = null;
            });
    });

    // Все слова отвечены — завершаем сессию (последний ответ карточек завершает её сам, см. submitFlashcard).
    useEffect(() => {
        if (
            session === null ||
            session.is_finished ||
            (session.quiz_type !== "flashcards" && session.quiz_type !== "pair") ||
            unresolvedCount !== 0 ||
            autoFinishSessionIdRef.current === session.id
        ) {
            return;
        }

        autoFinishSessionIdRef.current = session.id;
        finishSessionAutomatically(session.id);
    }, [session, unresolvedCount]);

    useEffect(() => {
        viewedFlashcardIdsRef.current.clear();
    }, [sessionId]);

    const quizType = session?.quiz_type;
    useEffect(() => {
        if (sessionId !== null && quizType === "flashcards") {
            writeFlashcardAutoSpeakSetting(sessionId, autoSpeakAfterFlip);
        }
    }, [sessionId, quizType, autoSpeakAfterFlip]);

    const startSession = async ({ auto_speak_after_flip, ...payload }: StartPayload) => {
        setAutoSpeakAfterFlip(auto_speak_after_flip);
        autoFinishSessionIdRef.current = null;

        try {
            const json = await startQuizletSession(payload);
            writeFlashcardAutoSpeakSetting(
                json.session.id,
                payload.quiz_type === "flashcards" && auto_speak_after_flip,
            );
            navigate(payload.quiz_type === "flashcards" ? studentQuizletPaths.flashcards : studentQuizletPaths.pairs);
            await loadSession(json.session.id);
        } catch {
            return;
        }
    };

    /** Начать (или продолжить) сессию по заданию; возвращает текст ошибки или null. */
    const startAssignmentSession = async (assignmentId: number): Promise<string | null> => {
        try {
            const json = await startQuizletAssignmentSession(assignmentId);
            onHubChanged();
            await loadSession(json.session.id);
            return null;
        } catch (error) {
            return getApiErrorMessage(error, "Не удалось открыть задание");
        }
    };

    const continueSession = (activeSessionId: number) => {
        autoFinishSessionIdRef.current = null;
        return loadSession(activeSessionId);
    };

    const endNow = async () => {
        if (session === null) {
            return;
        }

        try {
            const json = await endQuizletSession(session.id, true);
            onHubChanged();
            queryClient.setQueryData<TQuizletSessionDetails>(quizletKeys.session(session.id), (prev) =>
                prev === undefined ? prev : { ...prev, session: { ...json.session, is_finished: true } },
            );
            await refreshSession(session.id);
        } catch {
            return;
        }
    };

    const retry = async (onlyIncorrect: boolean) => {
        if (session === null) {
            return;
        }

        try {
            const json = await retryQuizletSession(session.id, onlyIncorrect);
            writeFlashcardAutoSpeakSetting(json.session.id, autoSpeakAfterFlip);
            await loadSession(json.session.id, onlyIncorrect);
        } catch {
            return;
        }
    };

    const submitPairAttempt = async (leftWordId: number, rightWordId: number) => {
        if (session === null) {
            return false;
        }

        try {
            const response = await submitQuizletPairAttempt(session.id, leftWordId, rightWordId);
            refreshSession(session.id);
            return response.is_correct;
        } catch {
            return false;
        }
    };

    const submitFlashcard = async (wordId: number, recognized: boolean) => {
        if (session === null) {
            return;
        }

        // Ответ на последнее слово очереди (и «помню», и «не помню») завершает сессию.
        const shouldFinishAfterAnswer = queue.length === 1 && queue[0] === wordId;

        await submitQuizletFlashcardAnswer(session.id, wordId, recognized);

        if (shouldFinishAfterAnswer) {
            autoFinishSessionIdRef.current = session.id;
            await endQuizletSession(session.id, false);
            onHubChanged();
        }

        refreshSession(session.id);
    };

    const markFlashcardVisible = (wordId: number) => {
        if (session === null || viewedFlashcardIdsRef.current.has(wordId)) {
            return;
        }

        viewedFlashcardIdsRef.current.add(wordId);
        markQuizletFlashcardViewed(session.id, wordId).catch(() => {
            viewedFlashcardIdsRef.current.delete(wordId);
        });
    };

    const closeSession = useCallback(() => {
        loadRequestIdRef.current += 1;
        autoFinishSessionIdRef.current = null;
        setAutoSpeakAfterFlip(false);
        setSessionId(null);
    }, []);

    return {
        session,
        queue,
        orderedSessionWords,
        unresolvedCount,
        liveElapsedSeconds,
        autoSpeakAfterFlip,
        setAutoSpeakAfterFlip,
        startSession,
        startAssignmentSession,
        continueSession,
        endNow,
        retryIncorrect: () => retry(true),
        retryAll: () => retry(false),
        submitPairAttempt,
        submitFlashcard,
        markFlashcardVisible,
        closeSession,
    };
};

export type QuizletSessionState = ReturnType<typeof useQuizletSession>;
