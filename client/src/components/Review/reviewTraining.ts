import { TReviewTrainingResult } from "api/review";
import { ReviewTrainingHistoryEntry } from "components/Review/ReviewTrainingHistory";
import { TReviewTopic, TReviewWord, TReviewWordStatus } from "models/TReview";

export interface TrainingAssessment {
    forgot: number;
    partial: number;
    remember: number;
}

export interface TrainingSession {
    allWordIds: number[];
    initialWordIds: number[];
    topicIds: number[];
    queue: number[];
    openedWordIds: number[];
    mode: ReviewTrainingMode;
    direction: "jp_to_ru" | "ru_to_jp";
    assessments: Record<number, TrainingAssessment>;
    startedAt: number;
    elapsedSeconds: number;
    isFinished: boolean;
}

export type ReviewTrainingMode = "topics" | "random" | "smart_random";
export type ReviewTrainingResult = TReviewTrainingResult;

export type FlashcardDetailKey = "source" | "note" | "examples";

export const shuffleArray = <T>(items: T[]) => {
    const result = [...items];

    for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }

    return result;
};

export const REVIEW_RANDOM_SESSION_SIZES = [50, 100, 150, 200] as const;
export const SMART_RANDOM_WEIGHTS: Record<TReviewWordStatus, number> = {
    shaky: 0.6,
    passive: 0.35,
    active: 0.05,
};

export const pickRandomWordIds = (items: TReviewWord[], requestedCount: number) =>
    shuffleArray(items)
        .slice(0, Math.min(requestedCount, items.length))
        .map((item) => item.id);

export const getSmartRandomTargetCounts = (requestedCount: number) => {
    const baseCounts = (Object.entries(SMART_RANDOM_WEIGHTS) as [TReviewWordStatus, number][]).map(
        ([status, weight]) => ({
            status,
            count: Math.floor(requestedCount * weight),
            fraction: requestedCount * weight - Math.floor(requestedCount * weight),
        }),
    );

    let remaining = requestedCount - baseCounts.reduce((total, item) => total + item.count, 0);
    const sortedByFraction = [...baseCounts].sort((left, right) => right.fraction - left.fraction);

    for (const item of sortedByFraction) {
        if (remaining === 0) {
            break;
        }

        item.count += 1;
        remaining -= 1;
    }

    return baseCounts.reduce<Record<TReviewWordStatus, number>>(
        (result, item) => ({ ...result, [item.status]: item.count }),
        { shaky: 0, passive: 0, active: 0 },
    );
};

export const pickSmartRandomWordIds = (items: TReviewWord[], requestedCount: number) => {
    const availableWords = items.filter((item) => !item.is_frozen);
    const limitedCount = Math.min(requestedCount, availableWords.length);

    if (limitedCount === 0) {
        return [];
    }

    const targetCounts = getSmartRandomTargetCounts(limitedCount);
    const selectedIds = new Set<number>();
    const selectedWords: TReviewWord[] = [];

    (Object.keys(targetCounts) as TReviewWordStatus[]).forEach((status) => {
        const pickedWords = shuffleArray(availableWords.filter((item) => item.status === status)).slice(
            0,
            targetCounts[status],
        );

        pickedWords.forEach((word) => {
            selectedIds.add(word.id);
            selectedWords.push(word);
        });
    });

    const remainingWords = shuffleArray(availableWords.filter((item) => !selectedIds.has(item.id))).slice(
        0,
        limitedCount - selectedWords.length,
    );

    return shuffleArray([...selectedWords, ...remainingWords]).map((item) => item.id);
};

export const insertWordLater = (queue: number[], wordId: number, times: number) => {
    const nextQueue = [...queue];

    for (let attempt = 0; attempt < times; attempt += 1) {
        if (nextQueue.length < 8) {
            nextQueue.push(wordId);
            continue;
        }

        const insertPos = 8 + Math.floor(Math.random() * (nextQueue.length - 8 + 1));
        nextQueue.splice(insertPos, 0, wordId);
    }

    return nextQueue;
};

export const normalizeText = (value: string) => value.trim();

export const getTrainingResultForWord = (session: TrainingSession, wordId: number): ReviewTrainingResult | null => {
    if (!session.openedWordIds.includes(wordId)) {
        return null;
    }

    const assessment = session.assessments[wordId];

    if (assessment === undefined) {
        return "remember";
    }

    if (assessment.forgot > 0) {
        return "forgot";
    }

    if (assessment.partial > 0) {
        return "partial";
    }

    return "remember";
};

export const stopSpeaking = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();
};

export const speak = (text: string, lang: "ja-JP" | "ru-RU") => {
    const normalizedText = text.trim();

    if (!normalizedText || typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
    }

    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(normalizedText);
    utterance.lang = lang;
    utterance.voice = window.speechSynthesis.getVoices().find((voice) => voice.lang === lang) ?? null;
    utterance.rate = lang === "ru-RU" ? 2 : 1.3;

    window.speechSynthesis.speak(utterance);
};

export const REVIEW_TRAINING_HISTORY_STORAGE_KEY = "viponyata-review-training-history";
export const REVIEW_ACTIVE_TRAINING_STORAGE_KEY = "viponyata-review-active-training";
export const REVIEW_TRAINING_HISTORY_LIMIT = 100;

export const isDirectionValue = (value: unknown): value is TrainingSession["direction"] =>
    value === "jp_to_ru" || value === "ru_to_jp";

export const isTrainingModeValue = (value: unknown): value is ReviewTrainingMode =>
    value === "topics" || value === "random" || value === "smart_random";

export const isTrainingAssessmentValue = (value: unknown): value is TrainingAssessment => {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const assessment = value as Partial<TrainingAssessment>;

    return (
        typeof assessment.forgot === "number" &&
        typeof assessment.partial === "number" &&
        typeof assessment.remember === "number"
    );
};

export const isTrainingSessionValue = (value: unknown): value is TrainingSession => {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const session = value as Partial<TrainingSession>;

    return (
        Array.isArray(session.allWordIds) &&
        session.allWordIds.every((item) => typeof item === "number") &&
        Array.isArray(session.initialWordIds) &&
        session.initialWordIds.every((item) => typeof item === "number") &&
        Array.isArray(session.topicIds) &&
        session.topicIds.every((item) => typeof item === "number") &&
        Array.isArray(session.queue) &&
        session.queue.every((item) => typeof item === "number") &&
        Array.isArray(session.openedWordIds) &&
        session.openedWordIds.every((item) => typeof item === "number") &&
        isTrainingModeValue(session.mode) &&
        isDirectionValue(session.direction) &&
        typeof session.assessments === "object" &&
        session.assessments !== null &&
        Object.values(session.assessments).every(isTrainingAssessmentValue) &&
        typeof session.startedAt === "number" &&
        typeof session.elapsedSeconds === "number" &&
        typeof session.isFinished === "boolean"
    );
};

export const sanitizeTrainingSession = (
    value: TrainingSession,
    availableWords: TReviewWord[],
    availableTopics: TReviewTopic[],
): TrainingSession | null => {
    const validWordIds = new Set(availableWords.map((word) => word.id));
    const validTopicIds = new Set(availableTopics.map((topic) => topic.id));

    const initialWordIds = value.initialWordIds.filter((wordId) => validWordIds.has(wordId));
    const allWordIds = value.allWordIds.filter((wordId) => validWordIds.has(wordId));
    const queue = value.queue.filter((wordId) => validWordIds.has(wordId));
    const openedWordIds = value.openedWordIds.filter((wordId) => validWordIds.has(wordId));
    const topicIds = value.topicIds.filter((topicId) => validTopicIds.has(topicId));
    const assessments = Object.fromEntries(
        Object.entries(value.assessments).filter(([wordId, assessment]) => {
            return validWordIds.has(Number(wordId)) && isTrainingAssessmentValue(assessment);
        }),
    ) as Record<number, TrainingAssessment>;

    if (initialWordIds.length === 0 || (!value.isFinished && queue.length === 0)) {
        return null;
    }

    return {
        ...value,
        allWordIds: allWordIds.length > 0 ? allWordIds : initialWordIds,
        initialWordIds,
        topicIds,
        queue,
        openedWordIds,
        assessments,
    };
};

export const getReviewTrainingModeLabel = (mode: ReviewTrainingMode) => {
    if (mode === "topics") {
        return "По топикам";
    }

    if (mode === "smart_random") {
        return "Smart Random Review";
    }

    return "Random Review";
};

export const formatSessionStartDateTime = (value: number): string => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

export const isReviewTrainingHistoryEntry = (value: unknown): value is ReviewTrainingHistoryEntry => {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const entry = value as Partial<ReviewTrainingHistoryEntry>;

    return (
        typeof entry.id === "string" &&
        typeof entry.startedAt === "number" &&
        typeof entry.endedAt === "number" &&
        typeof entry.elapsedSeconds === "number" &&
        typeof entry.reviewedWords === "number" &&
        typeof entry.skippedWords === "number" &&
        typeof entry.incorrectAnswers === "number" &&
        typeof entry.totalWords === "number" &&
        isDirectionValue(entry.direction) &&
        typeof entry.easyCount === "number" &&
        typeof entry.partialCount === "number" &&
        typeof entry.forgotCount === "number" &&
        Array.isArray(entry.topicTitles) &&
        entry.topicTitles.every((item) => typeof item === "string")
    );
};

export const getReviewTrainingHistoryFingerprint = (entry: ReviewTrainingHistoryEntry) =>
    JSON.stringify({
        startedAt: entry.startedAt,
        endedAt: entry.endedAt,
        elapsedSeconds: entry.elapsedSeconds,
        reviewedWords: entry.reviewedWords,
        skippedWords: entry.skippedWords,
        incorrectAnswers: entry.incorrectAnswers,
        totalWords: entry.totalWords,
        direction: entry.direction,
        easyCount: entry.easyCount,
        partialCount: entry.partialCount,
        forgotCount: entry.forgotCount,
        topicTitles: [...entry.topicTitles].sort(),
    });

export const dedupeReviewTrainingHistoryEntries = (entries: ReviewTrainingHistoryEntry[]) => {
    const seenFingerprints = new Set<string>();

    return entries.filter((entry) => {
        const fingerprint = getReviewTrainingHistoryFingerprint(entry);

        if (seenFingerprints.has(fingerprint)) {
            return false;
        }

        seenFingerprints.add(fingerprint);
        return true;
    });
};

export const getTrainingResultSummary = (session: TrainingSession) => {
    let easy = 0;
    let partial = 0;
    let forgot = 0;
    let notReviewed = 0;

    session.initialWordIds.forEach((wordId) => {
        const assessment = session.assessments[wordId];
        const isOpened = session.openedWordIds.includes(wordId);

        if (!isOpened) {
            notReviewed += 1;
            return;
        }

        if (!assessment || (assessment.forgot === 0 && assessment.partial === 0)) {
            easy += 1;
            return;
        }

        if (assessment.forgot > 0) {
            forgot += 1;
            return;
        }

        partial += 1;
    });

    return {
        easy,
        partial,
        forgot,
        notReviewed,
        forgottenIdsCount: partial + forgot + notReviewed,
    };
};

export const getTrainingIncorrectAnswers = (session: TrainingSession) =>
    Object.values(session.assessments).reduce((total, assessment) => total + assessment.forgot + assessment.partial, 0);

export const mergeUpdatedWords = (currentWords: TReviewWord[], updatedWords: TReviewWord[]) => {
    const updatedWordById = new Map(updatedWords.map((word) => [word.id, word]));

    return currentWords.map((word) => updatedWordById.get(word.id) ?? word);
};

export const createEmptyStageSummary = () => ({ 1: 0, 2: 0, 3: 0 });
