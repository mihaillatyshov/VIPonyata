import { TQuizletSession, TQuizletSessionWord } from "models/TQuizlet";

export const getWordChar = (word: Pick<TQuizletSessionWord, "char_jp" | "word_jp">) => {
    return word.char_jp && word.char_jp.length > 0 ? word.char_jp : word.word_jp;
};

export const hasValidKanaHint = (word: Pick<TQuizletSessionWord, "char_jp" | "word_jp">) => {
    if (typeof word.char_jp !== "string" || typeof word.word_jp !== "string") {
        return false;
    }

    const kanji = word.char_jp.trim();
    const kana = word.word_jp.trim();
    return kanji !== "" && kana !== "" && kana !== kanji;
};

export const parseQueue = (session: TQuizletSession & { queue_state?: string }) => {
    const queueState = (session as any).queue_state;
    if (typeof queueState !== "string") {
        return [] as number[];
    }

    try {
        const parsed = JSON.parse(queueState);
        return Array.isArray(parsed) ? (parsed as number[]).map((item) => Number(item)) : [];
    } catch {
        return [];
    }
};

export const formatDuration = (seconds: number) => {
    const clamped = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(clamped / 60);
    const secs = clamped % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Fisher-Yates shuffle algorithm for randomizing array in-place
 * Returns a shuffled copy of the array
 */
export const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};
