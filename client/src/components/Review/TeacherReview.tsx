import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Loading from "components/Common/Loading";
import ErrorPage from "components/ErrorPages/ErrorPage";
import TrainingSessionHeader from "components/Quizlet/TrainingSessionHeader";
import ReviewTrainingHistory, { ReviewTrainingHistoryEntry } from "components/Review/ReviewTrainingHistory";
import { AjaxDelete, AjaxGet, AjaxPatch, AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { TReviewDictionary, TReviewTopic, TReviewWord, TReviewWordStatus } from "models/TReview";

import "components/Quizlet/FlashcardExercise.css";
import "components/Quizlet/QuizletSessionResults.css";
import "components/Quizlet/QuizletShared.css";
import "./TeacherReview.css";

interface ReviewCatalogResponse {
    dictionaries: TReviewDictionary[];
    topics: TReviewTopic[];
    words: TReviewWord[];
}

interface EditorRow {
    key: string;
    id?: number;
    source: string;
    word_jp: string;
    ru: string;
    note: string;
    examples: string;
}

interface TrainingAssessment {
    forgot: number;
    partial: number;
    remember: number;
}

interface TrainingSession {
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

type ReviewTrainingMode = "topics" | "random" | "smart_random";
type ReviewTrainingResult = "remember" | "partial" | "forgot";

type FlashcardDetailKey = "source" | "note" | "examples";

const ROW_FIELDS = ["source", "word_jp", "ru", "note", "examples"] as const;
type RowField = (typeof ROW_FIELDS)[number];

let rowCounter = 0;
const makeKey = () => `review_row_${++rowCounter}`;
const makeEmptyRow = (): EditorRow => ({ key: makeKey(), source: "", word_jp: "", ru: "", note: "", examples: "" });

const wordsToRows = (words: TReviewWord[]): EditorRow[] =>
    words.map((word) => ({
        key: makeKey(),
        id: word.id,
        source: word.source ?? "",
        word_jp: word.word_jp,
        ru: word.ru,
        note: word.note ?? "",
        examples: word.examples ?? "",
    }));

const parseClipboardTable = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = "";
    let inQuotes = false;

    const pushCell = () => {
        currentRow.push(currentCell);
        currentCell = "";
    };

    const pushRow = () => {
        pushCell();
        rows.push(currentRow);
        currentRow = [];
    };

    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        const nextChar = text[index + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentCell += '"';
                index += 1;
                continue;
            }

            inQuotes = !inQuotes;
            continue;
        }

        if (!inQuotes && char === "\t") {
            pushCell();
            continue;
        }

        if (!inQuotes && (char === "\n" || char === "\r")) {
            if (char === "\r" && nextChar === "\n") {
                index += 1;
            }

            pushRow();
            continue;
        }

        currentCell += char;
    }

    if (currentCell !== "" || currentRow.length > 0) {
        pushRow();
    }

    return rows.filter((row) => row.some((cell) => cell.trim() !== ""));
};

const shuffleArray = <T,>(items: T[]) => {
    const result = [...items];

    for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }

    return result;
};

const REVIEW_RANDOM_SESSION_SIZES = [50, 100, 150, 200] as const;
const SMART_RANDOM_WEIGHTS: Record<TReviewWordStatus, number> = {
    shaky: 0.6,
    passive: 0.35,
    active: 0.05,
};

const pickRandomWordIds = (items: TReviewWord[], requestedCount: number) =>
    shuffleArray(items)
        .slice(0, Math.min(requestedCount, items.length))
        .map((item) => item.id);

const getSmartRandomTargetCounts = (requestedCount: number) => {
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

const pickSmartRandomWordIds = (items: TReviewWord[], requestedCount: number) => {
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

const insertWordLater = (queue: number[], wordId: number, times: number) => {
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

const normalizeText = (value: string) => value.trim();

const getTrainingResultForWord = (session: TrainingSession, wordId: number): ReviewTrainingResult | null => {
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

const stopSpeaking = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();
};

const speak = (text: string, lang: "ja-JP" | "ru-RU") => {
    const normalizedText = text.trim();

    if (!normalizedText || typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
    }

    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(normalizedText);
    utterance.lang = lang;
    utterance.rate = lang === "ru-RU" ? 2 : 1.3;

    window.speechSynthesis.speak(utterance);
};

const REVIEW_TRAINING_HISTORY_STORAGE_KEY = "viponyata-review-training-history";
const REVIEW_ACTIVE_TRAINING_STORAGE_KEY = "viponyata-review-active-training";
const REVIEW_TRAINING_HISTORY_LIMIT = 100;
const REVIEW_ROUTE_PATHS = {
    root: "/review",
    training: "/review/training",
    history: "/review/training/history",
    statuses: "/review/training/statuses",
    flashcards: "/review/flashcards",
    results: "/review/results",
} as const;

const isDirectionValue = (value: unknown): value is TrainingSession["direction"] =>
    value === "jp_to_ru" || value === "ru_to_jp";

const isTrainingModeValue = (value: unknown): value is ReviewTrainingMode =>
    value === "topics" || value === "random" || value === "smart_random";

const isTrainingAssessmentValue = (value: unknown): value is TrainingAssessment => {
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

const isTrainingSessionValue = (value: unknown): value is TrainingSession => {
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

const sanitizeTrainingSession = (
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

const getReviewTrainingModeLabel = (mode: ReviewTrainingMode) => {
    if (mode === "topics") {
        return "По топикам";
    }

    if (mode === "smart_random") {
        return "Smart Random Review";
    }

    return "Random Review";
};

const formatSessionStartDateTime = (value: number): string => {
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

const isReviewTrainingHistoryEntry = (value: unknown): value is ReviewTrainingHistoryEntry => {
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

const getReviewTrainingHistoryFingerprint = (entry: ReviewTrainingHistoryEntry) =>
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

const dedupeReviewTrainingHistoryEntries = (entries: ReviewTrainingHistoryEntry[]) => {
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

const getTrainingResultSummary = (session: TrainingSession) => {
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

const getTrainingIncorrectAnswers = (session: TrainingSession) =>
    Object.values(session.assessments).reduce((total, assessment) => total + assessment.forgot + assessment.partial, 0);

const isRowEmpty = (row: EditorRow) =>
    normalizeText(row.source) === "" &&
    normalizeText(row.word_jp) === "" &&
    normalizeText(row.ru) === "" &&
    normalizeText(row.note) === "" &&
    normalizeText(row.examples) === "";

const mergeUpdatedWords = (currentWords: TReviewWord[], updatedWords: TReviewWord[]) => {
    const updatedWordById = new Map(updatedWords.map((word) => [word.id, word]));

    return currentWords.map((word) => updatedWordById.get(word.id) ?? word);
};

const createEmptyStageSummary = () => ({ 1: 0, 2: 0, 3: 0 });

interface ReviewTopicEditorProps {
    topic: TReviewTopic;
    initialWords: TReviewWord[];
    onSaved: () => void;
}

const ReviewTopicEditor = ({ topic, initialWords, onSaved }: ReviewTopicEditorProps) => {
    const [rows, setRows] = useState<EditorRow[]>(() =>
        initialWords.length > 0 ? wordsToRows(initialWords) : [makeEmptyRow()],
    );
    const [deletedIds, setDeletedIds] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const committedRowsRef = useRef<Map<number, Omit<EditorRow, "key" | "id">>>(new Map());
    const inputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());
    const pendingFocusRowKeyRef = useRef<string | null>(null);

    useEffect(() => {
        setRows(initialWords.length > 0 ? wordsToRows(initialWords) : [makeEmptyRow()]);
        setDeletedIds([]);
        committedRowsRef.current = new Map(
            initialWords.map((word) => [
                word.id,
                {
                    source: word.source ?? "",
                    word_jp: word.word_jp,
                    ru: word.ru,
                    note: word.note ?? "",
                    examples: word.examples ?? "",
                },
            ]),
        );
    }, [topic.id, initialWords]);

    useEffect(() => {
        if (pendingFocusRowKeyRef.current === null) {
            return;
        }

        const input = inputRefs.current.get(`${pendingFocusRowKeyRef.current}:source`);
        if (!input) {
            return;
        }

        input.focus();
        pendingFocusRowKeyRef.current = null;
    }, [rows]);

    const isDirty = useMemo(() => {
        if (deletedIds.length > 0) {
            return true;
        }

        return rows.some((row) => {
            if (isRowEmpty(row)) {
                return false;
            }

            if (row.id === undefined) {
                return true;
            }

            const committed = committedRowsRef.current.get(row.id);
            if (!committed) {
                return true;
            }

            return ROW_FIELDS.some((field) => committed[field] !== row[field]);
        });
    }, [rows, deletedIds]);

    const updateCell = (rowKey: string, field: RowField, value: string) => {
        setRows((prev) => prev.map((row) => (row.key === rowKey ? { ...row, [field]: value } : row)));
    };

    const addRow = () => {
        const row = makeEmptyRow();
        setRows((prev) => [...prev, row]);
        return row.key;
    };

    const handleCellKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== "Enter") {
            return;
        }

        event.preventDefault();
        pendingFocusRowKeyRef.current = addRow();
    };

    const removeRow = (rowIndex: number) => {
        const row = rows[rowIndex];

        if (row.id !== undefined) {
            setDeletedIds((prev) => [...prev, row.id!]);
        }

        setRows((prev) => {
            const nextRows = prev.filter((_, index) => index !== rowIndex);
            return nextRows.length > 0 ? nextRows : [makeEmptyRow()];
        });
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLTableElement>) => {
        const text = event.clipboardData.getData("text");

        if (!text.includes("\t") && !text.includes("\n")) {
            return;
        }

        event.preventDefault();

        const pastedRows: EditorRow[] = parseClipboardTable(text).map((cells) => ({
            key: makeKey(),
            source: cells[0]?.trim() ?? "",
            word_jp: cells[1]?.trim() ?? "",
            ru: cells[2]?.trim() ?? "",
            note: cells[3]?.trim() ?? "",
            examples: cells[4]?.trim() ?? "",
        }));

        if (pastedRows.length === 0) {
            return;
        }

        setRows((prev) => {
            const nonEmptyRows = prev.filter((row) => !isRowEmpty(row));
            return [...nonEmptyRows, ...pastedRows];
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(null);

        try {
            for (const deletedId of deletedIds) {
                await AjaxDelete({ url: `/api/review/words/${deletedId}` });
            }

            const nonEmptyRows = rows.filter((row) => !isRowEmpty(row));

            for (const row of nonEmptyRows) {
                const payload = {
                    source: normalizeText(row.source) || null,
                    word_jp: normalizeText(row.word_jp),
                    ru: normalizeText(row.ru),
                    note: normalizeText(row.note) || null,
                    examples: normalizeText(row.examples) || null,
                };

                if (row.id === undefined) {
                    await AjaxPost({
                        url: "/api/review/words",
                        body: {
                            topic_id: topic.id,
                            ...payload,
                        },
                    });
                    continue;
                }

                const committed = committedRowsRef.current.get(row.id);
                const hasChanged =
                    committed === undefined || ROW_FIELDS.some((field) => committed[field] !== row[field]);

                if (hasChanged) {
                    await AjaxPatch({ url: `/api/review/words/${row.id}`, body: payload });
                }
            }

            onSaved();
        } catch {
            setSaveError("Не удалось сохранить слова");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="table-responsive">
                <table
                    className="table table-sm table-bordered align-middle mb-2 review-topic-table"
                    onPaste={handlePaste}
                >
                    <thead>
                        <tr className="table-light">
                            <th>Источник</th>
                            <th>Словосочетание (jp)</th>
                            <th>Перевод (ru)</th>
                            <th>Примечание</th>
                            <th>Примеры</th>
                            <th style={{ width: "1%" }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr key={row.key}>
                                {ROW_FIELDS.map((field) => (
                                    <td key={field} className="p-0">
                                        <input
                                            type="text"
                                            className="form-control form-control-sm border-0 rounded-0 shadow-none"
                                            ref={(element) => {
                                                inputRefs.current.set(`${row.key}:${field}`, element);
                                            }}
                                            value={row[field]}
                                            onChange={(event) => updateCell(row.key, field, event.target.value)}
                                            onKeyDown={handleCellKeyDown}
                                            placeholder={field}
                                        />
                                    </td>
                                ))}
                                <td className="text-center p-0">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-link text-danger review-table-remove-btn"
                                        onClick={() => removeRow(rowIndex)}
                                    >
                                        ×
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={addRow}>
                    + Добавить строку
                </button>
                <div className="d-flex align-items-center gap-2">
                    {saveError && <span className="text-danger small">{saveError}</span>}
                    {isDirty && (
                        <button type="button" className="btn btn-success" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? "Сохранение..." : "Сохранить"}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

const TeacherReview = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const getDictionaryPath = (dictionaryId: number) => `/review/dictionaries/${dictionaryId}`;
    const getTopicPath = (topicId: number) => `/review/topics/${topicId}`;

    const dictionaryRouteMatch = location.pathname.match(/^\/review\/dictionaries\/(\d+)$/);
    const topicRouteMatch = location.pathname.match(/^\/review\/topics\/(\d+)$/);
    const selectedDictionaryId = dictionaryRouteMatch ? Number(dictionaryRouteMatch[1]) : null;
    const selectedTopicId = topicRouteMatch ? Number(topicRouteMatch[1]) : null;

    const isRootRoute = location.pathname === REVIEW_ROUTE_PATHS.root;
    const isTrainingSetupRoute = location.pathname === REVIEW_ROUTE_PATHS.training;
    const isTrainingHistoryRoute = location.pathname === REVIEW_ROUTE_PATHS.history;
    const isTrainingStatusesRoute = location.pathname === REVIEW_ROUTE_PATHS.statuses;
    const isFlashcardsRoute = location.pathname === REVIEW_ROUTE_PATHS.flashcards;
    const isResultsRoute = location.pathname === REVIEW_ROUTE_PATHS.results;

    const [loadStatus, setLoadStatus] = useState<LoadStatus.Type>(LoadStatus.NONE);
    const [dictionaries, setDictionaries] = useState<TReviewDictionary[]>([]);
    const [topics, setTopics] = useState<TReviewTopic[]>([]);
    const [words, setWords] = useState<TReviewWord[]>([]);
    const [newDictionaryTitle, setNewDictionaryTitle] = useState("");
    const [newTopicTitle, setNewTopicTitle] = useState("");
    const [editingDictionaryTitle, setEditingDictionaryTitle] = useState(false);
    const [dictionaryTitleDraft, setDictionaryTitleDraft] = useState("");
    const [editingTopicTitle, setEditingTopicTitle] = useState(false);
    const [topicTitleDraft, setTopicTitleDraft] = useState("");
    const [isDeleteDictionaryConfirming, setIsDeleteDictionaryConfirming] = useState(false);
    const [isDeleteTopicConfirming, setIsDeleteTopicConfirming] = useState(false);
    const [selectedTrainingTopicIds, setSelectedTrainingTopicIds] = useState<number[]>([]);
    const [trainingMode, setTrainingMode] = useState<ReviewTrainingMode>("topics");
    const [randomReviewCount, setRandomReviewCount] = useState<(typeof REVIEW_RANDOM_SESSION_SIZES)[number]>(50);
    const [trainingDirection, setTrainingDirection] = useState<"jp_to_ru" | "ru_to_jp">("jp_to_ru");
    const [speakJpAfterFlip, setSpeakJpAfterFlip] = useState(false);
    const [autoSpeakCards, setAutoSpeakCards] = useState(false);
    const [trainingSession, setTrainingSession] = useState<TrainingSession | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [openedDetailKeys, setOpenedDetailKeys] = useState<FlashcardDetailKey[]>([]);
    const [trainingHistory, setTrainingHistory] = useState<ReviewTrainingHistoryEntry[]>([]);
    const [hasTrainingHistoryError, setHasTrainingHistoryError] = useState(false);
    const [savedTrainingSession, setSavedTrainingSession] = useState<TrainingSession | null>(null);
    const [hasSavedTrainingSessionError, setHasSavedTrainingSessionError] = useState(false);
    const [expandedHistoryEntryId, setExpandedHistoryEntryId] = useState<string | null>(null);
    const [memoryStateError, setMemoryStateError] = useState<string | null>(null);
    const [isUpdatingWordMemoryState, setIsUpdatingWordMemoryState] = useState(false);

    const loadData = () => {
        setLoadStatus(LoadStatus.LOADING);
        AjaxGet<ReviewCatalogResponse>({ url: "/api/review" })
            .then((json) => {
                setDictionaries(json.dictionaries);
                setTopics(json.topics);
                setWords(json.words);
                setLoadStatus(LoadStatus.DONE);
            })
            .catch(() => {
                setLoadStatus(LoadStatus.ERROR);
            });
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        try {
            const rawValue = window.localStorage.getItem(REVIEW_TRAINING_HISTORY_STORAGE_KEY);

            if (rawValue === null) {
                setTrainingHistory([]);
                return;
            }

            const parsedValue = JSON.parse(rawValue);
            if (!Array.isArray(parsedValue)) {
                throw new Error("History payload is not an array");
            }

            const nextHistory = dedupeReviewTrainingHistoryEntries(parsedValue.filter(isReviewTrainingHistoryEntry));

            setTrainingHistory(nextHistory);

            if (nextHistory.length !== parsedValue.length) {
                window.localStorage.setItem(REVIEW_TRAINING_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
            }
        } catch {
            setTrainingHistory([]);
            setHasTrainingHistoryError(true);
        }
    }, []);

    useEffect(() => {
        if (loadStatus !== LoadStatus.DONE || trainingSession !== null) {
            return;
        }

        try {
            const rawValue = window.localStorage.getItem(REVIEW_ACTIVE_TRAINING_STORAGE_KEY);

            if (rawValue === null) {
                setSavedTrainingSession(null);
                return;
            }

            const parsedValue = JSON.parse(rawValue);
            if (!isTrainingSessionValue(parsedValue)) {
                throw new Error("Saved training payload is invalid");
            }

            const nextSession = sanitizeTrainingSession(parsedValue, words, topics);

            if (nextSession === null || nextSession.isFinished) {
                window.localStorage.removeItem(REVIEW_ACTIVE_TRAINING_STORAGE_KEY);
                setSavedTrainingSession(null);
                return;
            }

            setSavedTrainingSession(nextSession);
            setHasSavedTrainingSessionError(false);

            if (JSON.stringify(nextSession) !== rawValue) {
                window.localStorage.setItem(REVIEW_ACTIVE_TRAINING_STORAGE_KEY, JSON.stringify(nextSession));
            }
        } catch {
            setSavedTrainingSession(null);
            setHasSavedTrainingSessionError(true);
        }
    }, [loadStatus, topics, trainingSession, words]);

    useEffect(() => {
        if (selectedDictionaryId !== null) {
            const dictionary = dictionaries.find((item) => item.id === selectedDictionaryId);
            setDictionaryTitleDraft(dictionary?.title ?? "");
            setEditingDictionaryTitle(false);
            setIsDeleteDictionaryConfirming(false);
        }
    }, [selectedDictionaryId, dictionaries]);

    useEffect(() => {
        if (selectedTopicId !== null) {
            const topic = topics.find((item) => item.id === selectedTopicId);
            setTopicTitleDraft(topic?.title ?? "");
            setEditingTopicTitle(false);
            setIsDeleteTopicConfirming(false);
        }
    }, [selectedTopicId, topics]);

    useEffect(() => {
        if (trainingSession === null) {
            setElapsedSeconds(0);
            return;
        }

        if (trainingSession.isFinished) {
            setElapsedSeconds(trainingSession.elapsedSeconds);
            return;
        }

        setElapsedSeconds(Math.floor((Date.now() - trainingSession.startedAt) / 1000));
        const intervalId = window.setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - trainingSession.startedAt) / 1000));
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [trainingSession]);

    useEffect(() => {
        if (trainingSession === null) {
            return;
        }

        if (trainingSession.isFinished) {
            try {
                window.localStorage.removeItem(REVIEW_ACTIVE_TRAINING_STORAGE_KEY);
                setHasSavedTrainingSessionError(false);
            } catch {
                setHasSavedTrainingSessionError(true);
            }

            setSavedTrainingSession(null);
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

    useEffect(() => {
        if (trainingSession !== null) {
            const targetPath = trainingSession.isFinished ? REVIEW_ROUTE_PATHS.results : REVIEW_ROUTE_PATHS.flashcards;

            if (location.pathname !== targetPath) {
                navigate(targetPath, { replace: true });
            }

            return;
        }

        if (isFlashcardsRoute || isResultsRoute) {
            navigate(REVIEW_ROUTE_PATHS.training, { replace: true });
        }
    }, [trainingSession, location.pathname, navigate, isFlashcardsRoute, isResultsRoute]);

    const selectedDictionary = useMemo(
        () =>
            selectedDictionaryId !== null
                ? (dictionaries.find((item) => item.id === selectedDictionaryId) ?? null)
                : null,
        [selectedDictionaryId, dictionaries],
    );
    const selectedTopic = useMemo(
        () => (selectedTopicId !== null ? (topics.find((item) => item.id === selectedTopicId) ?? null) : null),
        [selectedTopicId, topics],
    );
    const selectedDictionaryTopics = useMemo(
        () => topics.filter((topic) => topic.dictionary_id === selectedDictionaryId),
        [topics, selectedDictionaryId],
    );
    const selectedTopicWords = useMemo(
        () => words.filter((word) => word.topic_id === selectedTopicId),
        [words, selectedTopicId],
    );

    const wordsById = useMemo(() => new Map(words.map((word) => [word.id, word])), [words]);

    const groupedTopics = useMemo(
        () =>
            dictionaries.map((dictionary) => ({
                dictionary,
                topics: topics.filter((topic) => topic.dictionary_id === dictionary.id),
            })),
        [dictionaries, topics],
    );

    const currentWord = useMemo(() => {
        if (trainingSession === null || trainingSession.queue.length === 0) {
            return null;
        }

        return wordsById.get(trainingSession.queue[0]) ?? null;
    }, [trainingSession, wordsById]);

    const selectedTrainingWordsCount = useMemo(
        () => words.filter((word) => selectedTrainingTopicIds.includes(word.topic_id)).length,
        [words, selectedTrainingTopicIds],
    );
    const nonFrozenWords = useMemo(() => words.filter((word) => !word.is_frozen), [words]);
    const reviewStatusSummary = useMemo(
        () =>
            words.reduce(
                (summary, word) => {
                    if (word.is_frozen) {
                        summary.frozen += 1;
                        return summary;
                    }

                    summary[word.status] += 1;
                    summary.stages[word.status][word.stage] += 1;
                    return summary;
                },
                {
                    shaky: 0,
                    passive: 0,
                    active: 0,
                    frozen: 0,
                    stages: {
                        shaky: createEmptyStageSummary(),
                        passive: createEmptyStageSummary(),
                        active: createEmptyStageSummary(),
                    },
                },
            ),
        [words],
    );
    const trainingWordCountForMode = useMemo(() => {
        if (trainingMode === "topics") {
            return selectedTrainingWordsCount;
        }

        return Math.min(randomReviewCount, nonFrozenWords.length);
    }, [nonFrozenWords.length, randomReviewCount, selectedTrainingWordsCount, trainingMode]);
    const savedTrainingTopicTitles = useMemo(() => {
        if (savedTrainingSession === null) {
            return [] as string[];
        }

        const topicTitleById = new Map(topics.map((topic) => [topic.id, topic.title]));

        return savedTrainingSession.topicIds
            .map((topicId) => topicTitleById.get(topicId))
            .filter((topicTitle): topicTitle is string => Boolean(topicTitle));
    }, [savedTrainingSession, topics]);

    useEffect(() => {
        setIsFlipped(false);
        setOpenedDetailKeys([]);
    }, [currentWord?.id]);

    const createDictionary = async () => {
        const title = normalizeText(newDictionaryTitle);
        if (!title) {
            return;
        }

        await AjaxPost<{ dictionary: TReviewDictionary }>({ url: "/api/review/dictionaries", body: { title } });
        setNewDictionaryTitle("");
        loadData();
    };

    const renameDictionary = async () => {
        if (selectedDictionary === null) {
            return;
        }

        const title = normalizeText(dictionaryTitleDraft);
        if (!title) {
            return;
        }

        await AjaxPatch({
            url: `/api/review/dictionaries/${selectedDictionary.id}`,
            body: { title, sort: selectedDictionary.sort },
        });
        setEditingDictionaryTitle(false);
        loadData();
    };

    const removeDictionary = async () => {
        if (selectedDictionary === null) {
            return;
        }

        setIsDeleteDictionaryConfirming(false);
        await AjaxDelete({ url: `/api/review/dictionaries/${selectedDictionary.id}` });
        navigate(REVIEW_ROUTE_PATHS.root);
        loadData();
    };

    const createTopic = async () => {
        if (selectedDictionary === null) {
            return;
        }

        const title = normalizeText(newTopicTitle);
        if (!title) {
            return;
        }

        await AjaxPost<{ topic: TReviewTopic }>({
            url: "/api/review/topics",
            body: { dictionary_id: selectedDictionary.id, title },
        });
        setNewTopicTitle("");
        loadData();
    };

    const renameTopic = async () => {
        if (selectedTopic === null) {
            return;
        }

        const title = normalizeText(topicTitleDraft);
        if (!title) {
            return;
        }

        await AjaxPatch({
            url: `/api/review/topics/${selectedTopic.id}`,
            body: { title, sort: selectedTopic.sort },
        });
        setEditingTopicTitle(false);
        loadData();
    };

    const removeTopic = async () => {
        if (selectedTopic === null) {
            return;
        }

        setIsDeleteTopicConfirming(false);
        await AjaxDelete({ url: `/api/review/topics/${selectedTopic.id}` });
        navigate(getDictionaryPath(selectedTopic.dictionary_id));
        loadData();
    };

    const toggleTrainingTopic = (topicId: number) => {
        setSelectedTrainingTopicIds((prev) =>
            prev.includes(topicId) ? prev.filter((item) => item !== topicId) : [...prev, topicId],
        );
    };

    const toggleTrainingDictionary = (dictionaryId: number) => {
        const dictionaryTopicIds = topics
            .filter((topic) => topic.dictionary_id === dictionaryId)
            .map((topic) => topic.id);

        if (dictionaryTopicIds.length === 0) {
            return;
        }

        setSelectedTrainingTopicIds((prev) => {
            const allSelected = dictionaryTopicIds.every((topicId) => prev.includes(topicId));

            if (allSelected) {
                return prev.filter((topicId) => !dictionaryTopicIds.includes(topicId));
            }

            return [...new Set([...prev, ...dictionaryTopicIds])];
        });
    };

    const persistTrainingHistory = (entry: ReviewTrainingHistoryEntry) => {
        setTrainingHistory((prev) => {
            const nextHistory = dedupeReviewTrainingHistoryEntries([entry, ...prev]).slice(
                0,
                REVIEW_TRAINING_HISTORY_LIMIT,
            );

            try {
                window.localStorage.setItem(REVIEW_TRAINING_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
                setHasTrainingHistoryError(false);
            } catch {
                setHasTrainingHistoryError(true);
            }

            return nextHistory;
        });
    };

    const syncTrainingMemoryStates = (session: TrainingSession) => {
        const results = session.initialWordIds
            .map((wordId) => {
                const result = getTrainingResultForWord(session, wordId);
                if (result === null) {
                    return null;
                }

                return {
                    word_id: wordId,
                    result,
                };
            })
            .filter((item): item is { word_id: number; result: ReviewTrainingResult } => item !== null);

        if (results.length === 0) {
            return;
        }

        AjaxPost<{ words: TReviewWord[] }>({
            url: "/api/review/training/session-results",
            body: { results },
        })
            .then((json) => {
                setWords((prev) => mergeUpdatedWords(prev, json.words));
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
        mode: ReviewTrainingMode = trainingMode,
    ) => {
        const selectedWordIds =
            wordIds ?? words.filter((word) => selectedTrainingTopicIds.includes(word.topic_id)).map((word) => word.id);
        const sessionTopicIds =
            topicIds ??
            Array.from(new Set(words.filter((word) => selectedWordIds.includes(word.id)).map((word) => word.topic_id)));

        if (selectedWordIds.length === 0) {
            return;
        }

        stopSpeaking();
        setIsFlipped(false);
        setOpenedDetailKeys([]);
        setMemoryStateError(null);

        setTrainingSession({
            allWordIds: [...(allWordIds ?? selectedWordIds)],
            initialWordIds: [...selectedWordIds],
            topicIds: [...sessionTopicIds],
            queue: shuffleArray(selectedWordIds),
            openedWordIds: [],
            mode,
            direction: trainingDirection,
            assessments: {},
            startedAt: Date.now(),
            elapsedSeconds: 0,
            isFinished: false,
        });
    };

    const startConfiguredTraining = () => {
        if (trainingMode === "topics") {
            startTraining();
            return;
        }

        const availableWords = words.filter((word) => !word.is_frozen);
        const selectedWordIds =
            trainingMode === "random"
                ? pickRandomWordIds(availableWords, randomReviewCount)
                : pickSmartRandomWordIds(availableWords, randomReviewCount);

        startTraining(
            selectedWordIds,
            selectedWordIds,
            Array.from(
                new Set(
                    availableWords.filter((word) => selectedWordIds.includes(word.id)).map((word) => word.topic_id),
                ),
            ),
            trainingMode,
        );
    };

    const finalizeTrainingSession = (
        sessionToFinish: TrainingSession,
        nextQueue: number[],
        nextAssessments: Record<number, TrainingAssessment>,
    ) => {
        stopSpeaking();
        const finishedAt = Date.now();
        const finishedSession = {
            ...sessionToFinish,
            queue: nextQueue,
            assessments: nextAssessments,
            elapsedSeconds: Math.floor((finishedAt - sessionToFinish.startedAt) / 1000),
            isFinished: true,
        };
        const summary = getTrainingResultSummary(finishedSession);
        const reviewedWords = finishedSession.initialWordIds.length - summary.notReviewed;
        const topicTitleById = new Map(topics.map((topic) => [topic.id, topic.title]));

        persistTrainingHistory({
            id: `${finishedSession.startedAt}_${Math.random().toString(36).slice(2, 10)}`,
            startedAt: finishedSession.startedAt,
            endedAt: finishedAt,
            elapsedSeconds: finishedSession.elapsedSeconds,
            reviewedWords,
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

        try {
            window.localStorage.removeItem(REVIEW_ACTIVE_TRAINING_STORAGE_KEY);
            setHasSavedTrainingSessionError(false);
        } catch {
            setHasSavedTrainingSessionError(true);
        }

        setSavedTrainingSession(null);
        setTrainingSession(finishedSession);
    };

    const finishTraining = (nextQueue: number[], nextAssessments: Record<number, TrainingAssessment>) => {
        if (trainingSession === null || trainingSession.isFinished) {
            return;
        }

        finalizeTrainingSession(trainingSession, nextQueue, nextAssessments);
    };

    const finishCurrentTraining = () => {
        if (trainingSession === null) {
            return;
        }

        finishTraining(trainingSession.queue, trainingSession.assessments);
    };

    const continueSavedTraining = () => {
        if (savedTrainingSession === null || savedTrainingSession.isFinished) {
            return;
        }

        stopSpeaking();
        setMemoryStateError(null);
        setIsFlipped(false);
        setOpenedDetailKeys([]);
        setTrainingSession(savedTrainingSession);
    };

    const finishSavedTraining = () => {
        if (savedTrainingSession === null || savedTrainingSession.isFinished) {
            return;
        }

        finalizeTrainingSession(savedTrainingSession, savedTrainingSession.queue, savedTrainingSession.assessments);
    };

    const answerCurrentWord = (grade: "forgot" | "partial" | "remember") => {
        if (trainingSession === null || currentWord === null) {
            return;
        }

        const currentWordId = currentWord.id;
        const queueWithoutCurrent = trainingSession.queue.slice(1);
        const currentAssessment = trainingSession.assessments[currentWordId] ?? { forgot: 0, partial: 0, remember: 0 };
        const nextAssessments = {
            ...trainingSession.assessments,
            [currentWordId]: {
                ...currentAssessment,
                [grade]: currentAssessment[grade] + 1,
            },
        };

        let nextQueue = queueWithoutCurrent;

        if (grade === "forgot") {
            nextQueue = insertWordLater(queueWithoutCurrent, currentWordId, 1);
        } else if (grade === "partial") {
            nextQueue = insertWordLater(queueWithoutCurrent, currentWordId, 1);
        }

        setIsFlipped(false);
        setOpenedDetailKeys([]);

        if (nextQueue.length === 0) {
            finishTraining(nextQueue, nextAssessments);
            return;
        }

        setTrainingSession((prev) => {
            if (prev === null) {
                return prev;
            }

            return {
                ...prev,
                queue: nextQueue,
                assessments: nextAssessments,
            };
        });
    };

    const resetTraining = () => {
        stopSpeaking();
        try {
            window.localStorage.removeItem(REVIEW_ACTIVE_TRAINING_STORAGE_KEY);
            setHasSavedTrainingSessionError(false);
        } catch {
            setHasSavedTrainingSessionError(true);
        }

        setSavedTrainingSession(null);
        setTrainingSession(null);
        setIsFlipped(false);
        setOpenedDetailKeys([]);
        setMemoryStateError(null);
        navigate(REVIEW_ROUTE_PATHS.training);
    };

    const repeatAll = () => {
        if (trainingSession === null) {
            return;
        }

        startTraining(trainingSession.allWordIds, trainingSession.allWordIds, trainingSession.topicIds);
    };

    const repeatForgotten = () => {
        if (trainingSession === null) {
            return;
        }

        const forgottenWordIds = trainingSession.initialWordIds.filter((wordId) => {
            const assessment = trainingSession.assessments[wordId];
            const isOpened = trainingSession.openedWordIds.includes(wordId);

            if (!isOpened) {
                return true;
            }

            return assessment !== undefined && (assessment.forgot > 0 || assessment.partial > 0);
        });

        if (forgottenWordIds.length === 0) {
            return;
        }

        startTraining(forgottenWordIds, trainingSession.allWordIds, trainingSession.topicIds);
    };

    const resultSummary = useMemo(() => {
        if (trainingSession === null) {
            return { easy: 0, partial: 0, forgot: 0, notReviewed: 0, forgottenIdsCount: 0 };
        }

        return getTrainingResultSummary(trainingSession);
    }, [trainingSession]);

    const resultPerformanceEmoji = useMemo(() => {
        if (resultSummary.forgot === 0 && resultSummary.partial === 0) {
            return "😍";
        }

        return resultSummary.forgot > resultSummary.easy ? "🙃" : "😊";
    }, [resultSummary]);

    const trainingIncorrectAnswers = useMemo(() => {
        if (trainingSession === null) {
            return 0;
        }

        return getTrainingIncorrectAnswers(trainingSession);
    }, [trainingSession]);

    const trainingCurrentPosition = useMemo(() => {
        if (trainingSession === null) {
            return 1;
        }

        return Math.max(1, trainingSession.initialWordIds.length - trainingSession.queue.length + 1);
    }, [trainingSession]);

    const currentFlashcardSpeech = useMemo(() => {
        if (trainingSession === null || currentWord === null) {
            return null;
        }

        const visibleCardLanguage = isFlipped
            ? trainingSession.direction === "jp_to_ru"
                ? "ru"
                : "jp"
            : trainingSession.direction === "jp_to_ru"
              ? "jp"
              : "ru";

        return visibleCardLanguage === "jp"
            ? { text: currentWord.word_jp, lang: "ja-JP" as const, label: "JP", cardLanguage: "jp" as const }
            : { text: currentWord.ru, lang: "ru-RU" as const, label: "RU", cardLanguage: "ru" as const };
    }, [currentWord, isFlipped, trainingSession]);

    const shouldShowFlashcardSpeechButton =
        trainingSession !== null &&
        currentFlashcardSpeech !== null &&
        !(trainingSession.direction === "ru_to_jp" && currentFlashcardSpeech.cardLanguage === "ru");

    const toggleFlashcardFlip = () => {
        setIsFlipped((prev) => {
            const nextIsFlipped = !prev;

            if (nextIsFlipped) {
                setTrainingSession((sessionPrev) => {
                    if (
                        sessionPrev === null ||
                        currentWord === null ||
                        sessionPrev.openedWordIds.includes(currentWord.id)
                    ) {
                        return sessionPrev;
                    }

                    return {
                        ...sessionPrev,
                        openedWordIds: [...sessionPrev.openedWordIds, currentWord.id],
                    };
                });
            }

            return nextIsFlipped;
        });
    };

    useEffect(() => {
        if (
            trainingSession === null ||
            trainingSession.isFinished ||
            !isFlashcardsRoute ||
            currentFlashcardSpeech === null
        ) {
            return;
        }

        if (autoSpeakCards) {
            speak(currentFlashcardSpeech.text, currentFlashcardSpeech.lang);

            return;
        }

        if (speakJpAfterFlip && isFlipped && currentFlashcardSpeech.cardLanguage === "jp") {
            speak(currentFlashcardSpeech.text, currentFlashcardSpeech.lang);
        }
    }, [autoSpeakCards, currentFlashcardSpeech, isFlipped, isFlashcardsRoute, speakJpAfterFlip, trainingSession]);

    useEffect(() => {
        if (trainingSession === null || trainingSession.isFinished || currentWord === null || !isFlashcardsRoute) {
            return;
        }

        const handleFlashcardSpace = (event: KeyboardEvent) => {
            if (event.key !== " " || event.repeat || event.altKey || event.ctrlKey || event.metaKey) {
                return;
            }

            const target = event.target;

            if (
                target instanceof HTMLElement &&
                (target.isContentEditable ||
                    target.closest("input, textarea, select, button, a, [role='button'], [contenteditable='true']") !==
                        null)
            ) {
                return;
            }

            event.preventDefault();
            toggleFlashcardFlip();
        };

        window.addEventListener("keydown", handleFlashcardSpace);

        return () => {
            window.removeEventListener("keydown", handleFlashcardSpace);
        };
    }, [currentWord, isFlashcardsRoute, trainingSession]);

    const toggleDetail = (detailKey: FlashcardDetailKey) => {
        setOpenedDetailKeys((prev) =>
            prev.includes(detailKey) ? prev.filter((item) => item !== detailKey) : [...prev, detailKey],
        );
    };

    const toggleHistoryEntry = (entryId: string) => {
        setExpandedHistoryEntryId((prev) => (prev === entryId ? null : entryId));
    };

    const toggleCurrentWordFrozen = async () => {
        if (currentWord === null || isUpdatingWordMemoryState) {
            return;
        }

        setIsUpdatingWordMemoryState(true);

        try {
            const json = await AjaxPatch<{ word: TReviewWord }>({
                url: `/api/review/words/${currentWord.id}/memory-state`,
                body: { is_frozen: !currentWord.is_frozen },
            });

            setWords((prev) => mergeUpdatedWords(prev, [json.word]));
            setMemoryStateError(null);
        } catch {
            setMemoryStateError("Не удалось изменить состояние заморозки слова");
        } finally {
            setIsUpdatingWordMemoryState(false);
        }
    };

    const renderFlashcardExtraZone = (cardLanguage: "jp" | "ru") => {
        if (currentWord === null) {
            return null;
        }

        const detailKeys: FlashcardDetailKey[] = [];

        if (cardLanguage === "jp") {
            if (currentWord.source) {
                detailKeys.push("source");
            }

            if (currentWord.examples) {
                detailKeys.push("examples");
            }
        } else if (currentWord.note) {
            detailKeys.push("note");
        }

        if (detailKeys.length === 0) {
            return null;
        }

        return (
            <div className="review-flashcard-extra-zone">
                <div className="review-flashcard-extra-toggle">
                    {detailKeys.includes("source") && (
                        <button
                            type="button"
                            className={`btn btn-sm ${openedDetailKeys.includes("source") ? "btn-success" : "btn-outline-success"}`}
                            onClick={(event) => {
                                event.stopPropagation();
                                toggleDetail("source");
                            }}
                        >
                            Источник
                        </button>
                    )}
                    {detailKeys.includes("note") && (
                        <button
                            type="button"
                            className={`btn btn-sm ${openedDetailKeys.includes("note") ? "btn-success" : "btn-outline-success"}`}
                            onClick={(event) => {
                                event.stopPropagation();
                                toggleDetail("note");
                            }}
                        >
                            Примечание
                        </button>
                    )}
                    {detailKeys.includes("examples") && (
                        <button
                            type="button"
                            className={`btn btn-sm ${openedDetailKeys.includes("examples") ? "btn-success" : "btn-outline-success"}`}
                            onClick={(event) => {
                                event.stopPropagation();
                                toggleDetail("examples");
                            }}
                        >
                            Примеры
                        </button>
                    )}
                </div>

                <div className="review-flashcard-extra-list">
                    {detailKeys.includes("source") && openedDetailKeys.includes("source") && currentWord.source && (
                        <div className="review-flashcard-extra-item">
                            <div className="small text-muted mb-1">Источник</div>
                            <div>{currentWord.source}</div>
                        </div>
                    )}
                    {detailKeys.includes("note") && openedDetailKeys.includes("note") && currentWord.note && (
                        <div className="review-flashcard-extra-item">
                            <div className="small text-muted mb-1">Примечание</div>
                            <div>{currentWord.note}</div>
                        </div>
                    )}
                    {detailKeys.includes("examples") &&
                        openedDetailKeys.includes("examples") &&
                        currentWord.examples && (
                            <div className="review-flashcard-extra-item">
                                <div className="small text-muted mb-1">Примеры</div>
                                <div style={{ whiteSpace: "pre-wrap" }}>{currentWord.examples}</div>
                            </div>
                        )}
                </div>
            </div>
        );
    };

    if (loadStatus === LoadStatus.ERROR) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Не удалось загрузить раздел 復習"
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (loadStatus !== LoadStatus.DONE) {
        return <Loading />;
    }

    return (
        <div className="container review-page">
            {!isFlashcardsRoute && !isResultsRoute && (
                <div className="review-mode-tabs-row">
                    <div
                        className="quizlet-student-dictionary-tabs"
                        role="tablist"
                        aria-label="Переключение режимов review"
                    >
                        <button
                            type="button"
                            role="tab"
                            aria-selected={isRootRoute}
                            className={`btn quizlet-student-dictionary-tab ${isRootRoute ? "active" : ""}`}
                            onClick={() => navigate(REVIEW_ROUTE_PATHS.root)}
                        >
                            Словари
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={isTrainingSetupRoute}
                            className={`btn quizlet-student-dictionary-tab ${isTrainingSetupRoute ? "active" : ""}`}
                            onClick={() => navigate(REVIEW_ROUTE_PATHS.training)}
                        >
                            Тренировка
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={isTrainingHistoryRoute}
                            className={`btn quizlet-student-dictionary-tab ${isTrainingHistoryRoute ? "active" : ""}`}
                            onClick={() => navigate(REVIEW_ROUTE_PATHS.history)}
                        >
                            История
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={isTrainingStatusesRoute}
                            className={`btn quizlet-student-dictionary-tab ${isTrainingStatusesRoute ? "active" : ""}`}
                            onClick={() => navigate(REVIEW_ROUTE_PATHS.statuses)}
                        >
                            Статусы
                        </button>
                    </div>
                </div>
            )}

            {trainingSession === null &&
                savedTrainingSession !== null &&
                !savedTrainingSession.isFinished &&
                !isFlashcardsRoute &&
                !isResultsRoute && (
                    <div className="review-library-container review-resume-banner">
                        <div className="alert alert-warning d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2 mb-0">
                            <div>
                                <div className="fw-semibold mb-1">Есть незавершенное повторение</div>
                                <div className="small">
                                    Тип: {getReviewTrainingModeLabel(savedTrainingSession.mode)} • Прогресс:{" "}
                                    {savedTrainingSession.openedWordIds.length}/
                                    {savedTrainingSession.initialWordIds.length}
                                </div>
                                <div className="small">
                                    Начало: {formatSessionStartDateTime(savedTrainingSession.startedAt)}
                                </div>
                                {savedTrainingTopicTitles.length > 0 && (
                                    <div className="small">Темы: {savedTrainingTopicTitles.join(", ")}</div>
                                )}
                            </div>
                            <div className="d-flex gap-2">
                                <button type="button" className="btn btn-warning" onClick={continueSavedTraining}>
                                    Продолжить
                                </button>
                                <button type="button" className="btn btn-outline-danger" onClick={finishSavedTraining}>
                                    Завершить
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            {trainingSession === null && hasSavedTrainingSessionError && !isFlashcardsRoute && !isResultsRoute && (
                <div className="review-library-container review-resume-banner">
                    <div className="alert alert-warning mb-0">Не удалось восстановить незавершенное повторение</div>
                </div>
            )}

            {isRootRoute && (
                <div className="review-section-card review-library-container">
                    <div className="mb-3 d-flex gap-2 align-items-center quizlet-personal-topic-create-row">
                        <input
                            className="form-control quizlet-personal-topic-create-input"
                            value={newDictionaryTitle}
                            onChange={(event) => setNewDictionaryTitle(event.target.value)}
                            placeholder="Новый словарь..."
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    createDictionary();
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="btn btn-success btn-sm quizlet-personal-topic-create-btn"
                            onClick={createDictionary}
                        >
                            + Добавить
                        </button>
                    </div>

                    {dictionaries.length === 0 ? (
                        <div className="text-muted">Пока нет словарей. Создайте первый.</div>
                    ) : (
                        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-2 pt-1">
                            {dictionaries.map((dictionary) => {
                                const dictionaryTopics = topics.filter(
                                    (topic) => topic.dictionary_id === dictionary.id,
                                );
                                const dictionaryTopicIds = new Set(dictionaryTopics.map((topic) => topic.id));
                                const wordCount = words.filter((word) => dictionaryTopicIds.has(word.topic_id)).length;

                                return (
                                    <div className="col" key={dictionary.id}>
                                        <button
                                            type="button"
                                            className="btn w-100 text-start p-0 border-0 quizlet-topic-card-btn"
                                            onClick={() => navigate(getDictionaryPath(dictionary.id))}
                                        >
                                            <div className="card quizlet-topic-card h-100">
                                                <div className="card-body d-flex flex-column justify-content-between">
                                                    <span className="quizlet-topic-card__title fw-semibold">
                                                        {dictionary.title}
                                                    </span>
                                                    <span className="quizlet-topic-card__count text-muted mt-2">
                                                        <i className="bi bi-collection me-1" />
                                                        {dictionaryTopics.length} тем
                                                        <span className="mx-2">•</span>
                                                        <i className="bi bi-card-text me-1" />
                                                        {wordCount} карточек
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {selectedDictionary !== null && (
                <div className="review-section-card review-library-container">
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                        <nav
                            aria-label="breadcrumb"
                            className="quizlet-teacher-breadcrumb quizlet-student-view-breadcrumb"
                        >
                            <ol className="breadcrumb mb-0">
                                <li className="breadcrumb-item">
                                    <Link to={REVIEW_ROUTE_PATHS.root}>復習</Link>
                                </li>
                                <li
                                    className={`breadcrumb-item ${!editingDictionaryTitle ? "active" : ""}`}
                                    {...(!editingDictionaryTitle ? { "aria-current": "page" } : {})}
                                >
                                    {!editingDictionaryTitle ? (
                                        <span className="d-inline-flex align-items-center gap-2">
                                            <span>{selectedDictionary.title}</span>
                                            <button
                                                className="btn btn-sm btn-link p-0 text-muted quizlet-personal-topic-edit-btn"
                                                title="Переименовать словарь"
                                                onClick={() => {
                                                    setEditingDictionaryTitle(true);
                                                    setDictionaryTitleDraft(selectedDictionary.title);
                                                }}
                                            >
                                                <i className="bi bi-pencil" />
                                            </button>
                                        </span>
                                    ) : (
                                        <input
                                            className="quizlet-breadcrumb-inline-edit-input"
                                            value={dictionaryTitleDraft}
                                            onChange={(event) => setDictionaryTitleDraft(event.target.value)}
                                            autoFocus
                                            onBlur={renameDictionary}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                    renameDictionary();
                                                }
                                                if (event.key === "Escape") {
                                                    setEditingDictionaryTitle(false);
                                                    setDictionaryTitleDraft(selectedDictionary.title);
                                                }
                                            }}
                                        />
                                    )}
                                </li>
                            </ol>
                        </nav>

                        <div className="d-flex gap-2 align-items-center quizlet-personal-topic-header-actions">
                            {isDeleteDictionaryConfirming ? (
                                <>
                                    <button type="button" className="btn btn-danger btn-sm" onClick={removeDictionary}>
                                        Точно?
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => setIsDeleteDictionaryConfirming(false)}
                                    >
                                        Отмена
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    className="btn quizlet-personal-topic-delete-action-btn"
                                    onClick={() => setIsDeleteDictionaryConfirming(true)}
                                >
                                    Удалить словарь
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mb-3 d-flex gap-2 align-items-center quizlet-personal-topic-create-row">
                        <input
                            className="form-control quizlet-personal-topic-create-input"
                            value={newTopicTitle}
                            onChange={(event) => setNewTopicTitle(event.target.value)}
                            placeholder="Новая тема..."
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    createTopic();
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="btn btn-success btn-sm quizlet-personal-topic-create-btn"
                            onClick={createTopic}
                        >
                            + Добавить
                        </button>
                    </div>

                    {selectedDictionaryTopics.length === 0 ? (
                        <div className="text-muted">В этом словаре пока нет топиков.</div>
                    ) : (
                        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-2 pt-1">
                            {selectedDictionaryTopics.map((topic) => {
                                const topicWordCount = words.filter((word) => word.topic_id === topic.id).length;

                                return (
                                    <div className="col" key={topic.id}>
                                        <button
                                            type="button"
                                            className="btn w-100 text-start p-0 border-0 quizlet-topic-card-btn"
                                            onClick={() => navigate(getTopicPath(topic.id))}
                                        >
                                            <div className="card quizlet-topic-card h-100">
                                                <div className="card-body d-flex flex-column justify-content-between">
                                                    <span className="quizlet-topic-card__title">{topic.title}</span>
                                                    <span className="quizlet-topic-card__count text-muted mt-2">
                                                        <i className="bi bi-card-text me-1" />
                                                        {topicWordCount} карточек
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {selectedTopic !== null && (
                <div className="review-section-card">
                    <div className="d-grid gap-3">
                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                            <nav
                                aria-label="breadcrumb"
                                className="quizlet-teacher-breadcrumb quizlet-student-view-breadcrumb"
                            >
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item">
                                        <Link to={REVIEW_ROUTE_PATHS.root}>復習</Link>
                                    </li>
                                    <li className="breadcrumb-item">
                                        <Link to={getDictionaryPath(selectedTopic.dictionary_id)}>
                                            {dictionaries.find((item) => item.id === selectedTopic.dictionary_id)
                                                ?.title ?? "Словарь"}
                                        </Link>
                                    </li>
                                    <li
                                        className={`breadcrumb-item ${!editingTopicTitle ? "active" : ""}`}
                                        {...(!editingTopicTitle ? { "aria-current": "page" } : {})}
                                    >
                                        {!editingTopicTitle ? (
                                            <span className="d-inline-flex align-items-center gap-2">
                                                <span>{selectedTopic.title}</span>
                                                <button
                                                    className="btn btn-sm btn-link p-0 text-muted quizlet-personal-topic-edit-btn"
                                                    title="Переименовать топик"
                                                    onClick={() => {
                                                        setEditingTopicTitle(true);
                                                        setTopicTitleDraft(selectedTopic.title);
                                                    }}
                                                >
                                                    <i className="bi bi-pencil" />
                                                </button>
                                            </span>
                                        ) : (
                                            <input
                                                className="quizlet-breadcrumb-inline-edit-input"
                                                value={topicTitleDraft}
                                                onChange={(event) => setTopicTitleDraft(event.target.value)}
                                                autoFocus
                                                onBlur={renameTopic}
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter") {
                                                        renameTopic();
                                                    }
                                                    if (event.key === "Escape") {
                                                        setEditingTopicTitle(false);
                                                        setTopicTitleDraft(selectedTopic.title);
                                                    }
                                                }}
                                            />
                                        )}
                                    </li>
                                </ol>
                            </nav>

                            <div className="d-flex gap-2 align-items-center quizlet-personal-topic-header-actions">
                                {isDeleteTopicConfirming ? (
                                    <>
                                        <button type="button" className="btn btn-danger btn-sm" onClick={removeTopic}>
                                            Точно?
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm"
                                            onClick={() => setIsDeleteTopicConfirming(false)}
                                        >
                                            Отмена
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn quizlet-personal-topic-delete-action-btn"
                                        onClick={() => setIsDeleteTopicConfirming(true)}
                                    >
                                        Удалить топик
                                    </button>
                                )}
                            </div>
                        </div>

                        <ReviewTopicEditor topic={selectedTopic} initialWords={selectedTopicWords} onSaved={loadData} />
                    </div>
                </div>
            )}

            {(isTrainingSetupRoute || isTrainingHistoryRoute || isTrainingStatusesRoute) && (
                <div className="review-section-card review-library-container">
                    <div className="review-training-setup">
                        {isTrainingSetupRoute && (
                            <>
                                <section className="review-training-panel">
                                    <div className="review-training-mode-toggle">
                                        <button
                                            type="button"
                                            className={`btn review-direction-button ${trainingMode === "topics" ? "btn-success" : "btn-outline-success"}`}
                                            onClick={() => setTrainingMode("topics")}
                                        >
                                            По топикам
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn review-direction-button ${trainingMode === "random" ? "btn-success" : "btn-outline-success"}`}
                                            onClick={() => setTrainingMode("random")}
                                        >
                                            Random Review
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn review-direction-button ${trainingMode === "smart_random" ? "btn-success" : "btn-outline-success"}`}
                                            onClick={() => setTrainingMode("smart_random")}
                                        >
                                            Smart Random Review
                                        </button>
                                    </div>

                                    <div className="review-direction-toggle">
                                        <button
                                            type="button"
                                            className={`btn review-direction-button ${trainingDirection === "jp_to_ru" ? "btn-success" : "btn-outline-success"}`}
                                            onClick={() => setTrainingDirection("jp_to_ru")}
                                        >
                                            jp → ru
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn review-direction-button ${trainingDirection === "ru_to_jp" ? "btn-success" : "btn-outline-success"}`}
                                            onClick={() => setTrainingDirection("ru_to_jp")}
                                        >
                                            ru → jp
                                        </button>
                                    </div>

                                    <div className="form-check mt-3 mb-0">
                                        <input
                                            className="form-check-input"
                                            id="reviewSpeakJpAfterFlip"
                                            type="checkbox"
                                            checked={speakJpAfterFlip}
                                            onChange={(event) => {
                                                const nextChecked = event.target.checked;

                                                setSpeakJpAfterFlip(nextChecked);
                                                if (nextChecked) {
                                                    setAutoSpeakCards(false);
                                                }
                                                event.target.blur();
                                            }}
                                        />
                                        <label className="form-check-label" htmlFor="reviewSpeakJpAfterFlip">
                                            Озвучка после переворота (jp)
                                        </label>
                                    </div>

                                    <div className="form-check mt-2 mb-0">
                                        <input
                                            className="form-check-input"
                                            id="reviewAutoSpeakCards"
                                            type="checkbox"
                                            checked={autoSpeakCards}
                                            onChange={(event) => {
                                                const nextChecked = event.target.checked;

                                                setAutoSpeakCards(nextChecked);
                                                if (nextChecked) {
                                                    setSpeakJpAfterFlip(false);
                                                }
                                                event.target.blur();
                                            }}
                                        />
                                        <label className="form-check-label" htmlFor="reviewAutoSpeakCards">
                                            Автоозвучка
                                        </label>
                                    </div>

                                    {memoryStateError && (
                                        <div className="alert alert-warning mt-3 mb-0">{memoryStateError}</div>
                                    )}

                                    {/* <div className="small text-muted review-training-helper-text">
                                        Без ограничений по повторениям. Повторения для «забыла» и «частично» ставятся в очередь
                                        случайно, но не раньше чем через 8 карточек, если это возможно.
                                    </div> */}
                                </section>

                                {trainingMode === "topics" ? (
                                    <section className="review-training-panel">
                                        <div className="review-training-section-label">Топики</div>
                                        <div className="review-training-topic-list">
                                            {groupedTopics.map(({ dictionary, topics: dictionaryTopics }) => (
                                                <div className="border rounded p-2 mb-2" key={dictionary.id}>
                                                    {(() => {
                                                        const dictionaryTopicIds = dictionaryTopics.map(
                                                            (topic) => topic.id,
                                                        );
                                                        const selectedTopicsCount = dictionaryTopicIds.filter(
                                                            (topicId) => selectedTrainingTopicIds.includes(topicId),
                                                        ).length;
                                                        const isDictionarySelected =
                                                            dictionaryTopicIds.length > 0 &&
                                                            selectedTopicsCount === dictionaryTopicIds.length;
                                                        const isDictionaryPartiallySelected =
                                                            selectedTopicsCount > 0 && !isDictionarySelected;
                                                        const dictionaryWordCount = words.filter((word) =>
                                                            dictionaryTopicIds.includes(word.topic_id),
                                                        ).length;

                                                        return (
                                                            <div className="d-flex align-items-center mb-2">
                                                                <label className="form-check d-inline-flex align-items-center gap-2 mb-0 quizlet-group-checkbox-label">
                                                                    <input
                                                                        className="form-check-input mt-0"
                                                                        type="checkbox"
                                                                        checked={isDictionarySelected}
                                                                        disabled={dictionaryTopics.length === 0}
                                                                        ref={(input) => {
                                                                            if (input === null) {
                                                                                return;
                                                                            }

                                                                            input.indeterminate =
                                                                                isDictionaryPartiallySelected;
                                                                        }}
                                                                        onChange={(event) => {
                                                                            toggleTrainingDictionary(dictionary.id);
                                                                            event.target.blur();
                                                                        }}
                                                                    />
                                                                    <span className="fw-bold text-dark quizlet-group-checkbox-title">
                                                                        {dictionary.title}
                                                                        <span className="quizlet-dictionary-word-count">
                                                                            {` (${dictionaryTopics.length} тем • ${dictionaryWordCount} карточек)`}
                                                                        </span>
                                                                    </span>
                                                                </label>
                                                            </div>
                                                        );
                                                    })()}

                                                    {dictionaryTopics.length === 0 ? (
                                                        <div className="small text-muted">Нет топиков</div>
                                                    ) : (
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {dictionaryTopics.map((topic) => {
                                                                const topicWordCount = words.filter(
                                                                    (word) => word.topic_id === topic.id,
                                                                ).length;
                                                                const isSelected = selectedTrainingTopicIds.includes(
                                                                    topic.id,
                                                                );

                                                                return (
                                                                    <label
                                                                        key={topic.id}
                                                                        className="form-check me-3 quizlet-topic-checkbox-label"
                                                                    >
                                                                        <input
                                                                            className="form-check-input"
                                                                            type="checkbox"
                                                                            checked={isSelected}
                                                                            onChange={(event) => {
                                                                                toggleTrainingTopic(topic.id);
                                                                                event.target.blur();
                                                                            }}
                                                                        />
                                                                        <span className="form-check-label">
                                                                            {topic.title}
                                                                            <span className="quizlet-dictionary-word-count">
                                                                                {` (${topicWordCount})`}
                                                                            </span>
                                                                        </span>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                ) : (
                                    <section className="review-training-panel">
                                        <div className="review-training-section-label">
                                            {trainingMode === "random" ? "Random Review" : "Smart Random Review"}
                                        </div>
                                        <div
                                            className="review-random-size-list"
                                            role="radiogroup"
                                            aria-label="Размер сессии"
                                        >
                                            {REVIEW_RANDOM_SESSION_SIZES.map((size) => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    className={`btn ${randomReviewCount === size ? "btn-success" : "btn-outline-success"}`}
                                                    onClick={() => setRandomReviewCount(size)}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="small text-muted mt-3">
                                            {trainingMode === "random"
                                                ? "Случайная сессия берёт слова из всех незамороженных карточек."
                                                : "Smart Random Review смешивает незамороженные слова как 60% shaky, 35% passive и 5% active с добором из оставшихся слов при нехватке."}
                                        </div>
                                        <div className="review-random-summary mt-3">
                                            Доступно незамороженных карточек: <strong>{nonFrozenWords.length}</strong>
                                        </div>
                                    </section>
                                )}

                                <section className="review-training-panel review-training-panel-start">
                                    <div className="review-training-start-row">
                                        <button
                                            type="button"
                                            className="btn btn-success review-training-start-button"
                                            disabled={trainingWordCountForMode === 0}
                                            onClick={startConfiguredTraining}
                                        >
                                            Начать тренировку
                                        </button>
                                        <div className="review-training-selected-count">
                                            {trainingMode === "topics" ? "Выбрано карточек:" : "Размер сессии:"}{" "}
                                            <span>{trainingWordCountForMode}</span>
                                        </div>
                                    </div>
                                    {/* <div className="small text-muted review-training-start-hint">
                                        Выберите хотя бы один топик, чтобы запустить тренировку.
                                    </div> */}
                                </section>
                            </>
                        )}

                        {isTrainingHistoryRoute && (
                            <section className="review-training-panel">
                                <ReviewTrainingHistory
                                    entries={trainingHistory}
                                    expandedEntryId={expandedHistoryEntryId}
                                    hasStorageError={hasTrainingHistoryError}
                                    onRowClick={toggleHistoryEntry}
                                />
                            </section>
                        )}

                        {isTrainingStatusesRoute && (
                            <section className="review-training-panel">
                                <div className="review-status-grid">
                                    <div className="review-status-card shaky">
                                        <span className="review-status-card-label">🔴 shaky</span>
                                        <span className="review-status-card-value">{reviewStatusSummary.shaky}</span>
                                        <div className="review-status-card-stages">
                                            <span className="review-status-card-stage-pill">
                                                ◔ {reviewStatusSummary.stages.shaky[1]}
                                            </span>
                                            <span className="review-status-card-stage-pill">
                                                ◑ {reviewStatusSummary.stages.shaky[2]}
                                            </span>
                                            <span className="review-status-card-stage-pill">
                                                ◕ {reviewStatusSummary.stages.shaky[3]}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="review-status-card passive">
                                        <span className="review-status-card-label">🟡 passive</span>
                                        <span className="review-status-card-value">{reviewStatusSummary.passive}</span>
                                        <div className="review-status-card-stages">
                                            <span className="review-status-card-stage-pill">
                                                ◔ {reviewStatusSummary.stages.passive[1]}
                                            </span>
                                            <span className="review-status-card-stage-pill">
                                                ◑ {reviewStatusSummary.stages.passive[2]}
                                            </span>
                                            <span className="review-status-card-stage-pill">
                                                ◕ {reviewStatusSummary.stages.passive[3]}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="review-status-card active">
                                        <span className="review-status-card-label">🟢 active</span>
                                        <span className="review-status-card-value">{reviewStatusSummary.active}</span>
                                        <div className="review-status-card-stages">
                                            <span className="review-status-card-stage-pill">
                                                ◔ {reviewStatusSummary.stages.active[1]}
                                            </span>
                                            <span className="review-status-card-stage-pill">
                                                ◑ {reviewStatusSummary.stages.active[2]}
                                            </span>
                                            <span className="review-status-card-stage-pill">
                                                ◕ {reviewStatusSummary.stages.active[3]}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="review-status-card frozen">
                                        <span className="review-status-card-label">❄️ frozen</span>
                                        <span className="review-status-card-value">{reviewStatusSummary.frozen}</span>
                                        <div className="review-status-card-note">Скрыты из smart review</div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            )}

            {trainingSession !== null && !trainingSession.isFinished && currentWord !== null && isFlashcardsRoute && (
                <div className="flashcard-exercise review-flashcard-exercise">
                    <div className="flashcard-card-shell review-flashcard-shell">
                        <TrainingSessionHeader
                            incorrectAnswers={trainingIncorrectAnswers}
                            elapsedSeconds={elapsedSeconds}
                            currentPosition={trainingCurrentPosition}
                            totalWords={trainingSession.initialWordIds.length}
                            onFinishTraining={finishCurrentTraining}
                        />

                        <div
                            className="flashcard-speech-actions review-flashcard-speech-actions"
                            aria-label="Озвучка карточки"
                        >
                            {shouldShowFlashcardSpeechButton ? (
                                <button
                                    type="button"
                                    className="flashcard-speech-btn"
                                    onClick={() => {
                                        if (currentFlashcardSpeech === null) {
                                            return;
                                        }

                                        speak(currentFlashcardSpeech.text, currentFlashcardSpeech.lang);
                                    }}
                                >
                                    {`🔊 ${currentFlashcardSpeech?.label ?? "JP"}`}
                                </button>
                            ) : null}
                        </div>

                        <div className="review-flashcard-memory-actions" aria-label="Управление заморозкой слова">
                            <button
                                type="button"
                                className={`review-freeze-word-btn ${currentWord.is_frozen ? "is-active" : ""}`}
                                onClick={toggleCurrentWordFrozen}
                                disabled={isUpdatingWordMemoryState}
                                title={currentWord.is_frozen ? "Снять заморозку" : "Заморозить слово"}
                            >
                                ❄️
                            </button>
                        </div>

                        <button
                            type="button"
                            className={`flashcard-card ${isFlipped ? "is-flipped" : ""}`}
                            onClick={toggleFlashcardFlip}
                        >
                            <div className="flashcard-flip-inner">
                                <div className="flashcard-face flashcard-face-front">
                                    <div className="flashcard-content review-flashcard-back-content">
                                        <div className="review-flashcard-answer">
                                            <div
                                                className={`flashcard-main-word ${
                                                    trainingSession.direction === "ru_to_jp"
                                                        ? "flashcard-main-word-ru"
                                                        : ""
                                                }`}
                                            >
                                                {trainingSession.direction === "jp_to_ru"
                                                    ? currentWord.word_jp
                                                    : currentWord.ru}
                                            </div>
                                        </div>
                                        {renderFlashcardExtraZone(
                                            trainingSession.direction === "jp_to_ru" ? "jp" : "ru",
                                        )}
                                    </div>
                                </div>

                                <div className="flashcard-face flashcard-face-back">
                                    <div className="flashcard-content review-flashcard-back-content">
                                        <div className="review-flashcard-answer">
                                            <div
                                                className={`flashcard-main-word ${
                                                    trainingSession.direction === "ru_to_jp"
                                                        ? ""
                                                        : "flashcard-main-word-ru"
                                                }`}
                                            >
                                                {trainingSession.direction === "jp_to_ru"
                                                    ? currentWord.ru
                                                    : currentWord.word_jp}
                                            </div>
                                        </div>
                                        {renderFlashcardExtraZone(
                                            trainingSession.direction === "jp_to_ru" ? "ru" : "jp",
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>
                    </div>

                    <div className={`flashcard-actions review-flashcard-actions ${isFlipped ? "is-visible" : ""}`}>
                        <button
                            type="button"
                            className="btn btn-danger btn-lg"
                            onClick={() => answerCurrentWord("forgot")}
                        >
                            не помню
                        </button>
                        <button
                            type="button"
                            className="btn btn-warning btn-lg"
                            onClick={() => answerCurrentWord("partial")}
                        >
                            частично
                        </button>
                        <button
                            type="button"
                            className="btn btn-success btn-lg"
                            onClick={() => answerCurrentWord("remember")}
                        >
                            помню
                        </button>
                    </div>
                </div>
            )}

            {trainingSession !== null && trainingSession.isFinished && isResultsRoute && (
                <div className="quizlet-main-container quizlet-results" style={{ marginTop: "28px" }}>
                    <h2 className="quizlet-results-title">
                        Результаты <span aria-hidden>🎉</span>
                    </h2>

                    <div className="quizlet-results-stats">
                        <div className="quizlet-results-stat quizlet-results-stat-correct">
                            <span className="quizlet-results-icon" aria-hidden>
                                <i className="bi bi-check-circle-fill" />
                            </span>
                            <span className="quizlet-results-label">Помню сразу</span>
                            <span className="quizlet-results-value">{resultSummary.easy}</span>
                        </div>

                        <div className="quizlet-results-stat quizlet-results-stat-partial">
                            <span className="quizlet-results-icon" aria-hidden>
                                <i className="bi bi-exclamation-triangle-fill" />
                            </span>
                            <span className="quizlet-results-label">Частично</span>
                            <span className="quizlet-results-value">{resultSummary.partial}</span>
                        </div>

                        <div className="quizlet-results-stat quizlet-results-stat-incorrect">
                            <span className="quizlet-results-icon" aria-hidden>
                                <i className="bi bi-x-circle-fill" />
                            </span>
                            <span className="quizlet-results-label">Забыла</span>
                            <span className="quizlet-results-value">
                                {resultSummary.forgot}
                                <span className="quizlet-results-perf-emoji" aria-hidden>
                                    {resultPerformanceEmoji}
                                </span>
                            </span>
                        </div>

                        <div className="quizlet-results-stat quizlet-results-stat-not-reviewed">
                            <span className="quizlet-results-icon" aria-hidden>
                                <i className="bi bi-dash-circle-fill" />
                            </span>
                            <span className="quizlet-results-label">Не повторено</span>
                            <span className="quizlet-results-value">{resultSummary.notReviewed}</span>
                        </div>
                    </div>

                    <div className="quizlet-results-time-row">
                        <div className="quizlet-results-time" title="Время">
                            <span className="quizlet-results-time-value">
                                {Math.floor(trainingSession.elapsedSeconds / 60)}:
                                {`${trainingSession.elapsedSeconds % 60}`.padStart(2, "0")}
                            </span>
                            <i className="bi bi-clock quizlet-results-time-icon" aria-hidden />
                        </div>
                    </div>

                    <div className="quizlet-results-actions">
                        <button
                            type="button"
                            className="btn btn-warning quizlet-results-action-btn quizlet-btn-orange"
                            disabled={resultSummary.forgottenIdsCount === 0}
                            onClick={repeatForgotten}
                        >
                            <i className="bi bi-exclamation-triangle" aria-hidden />
                            Повторить забытое
                        </button>
                        <button
                            type="button"
                            className="btn btn-success quizlet-results-action-btn"
                            onClick={repeatAll}
                        >
                            <i className="bi bi-arrow-repeat" aria-hidden />
                            Повторить всё
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary quizlet-results-action-btn"
                            onClick={resetTraining}
                        >
                            <i className="bi bi-box-arrow-right" aria-hidden />К выбору топиков
                        </button>
                    </div>

                    {memoryStateError && <div className="alert alert-warning mt-3 mb-0">{memoryStateError}</div>}
                </div>
            )}
        </div>
    );
};

export default TeacherReview;
