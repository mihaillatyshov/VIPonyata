import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Loading from "components/Common/Loading";
import ErrorPage from "components/ErrorPages/ErrorPage";
import TrainingSessionHeader from "components/Quizlet/TrainingSessionHeader";
import ReviewTrainingHistory, { ReviewTrainingHistoryEntry } from "components/Review/ReviewTrainingHistory";
import { AjaxDelete, AjaxGet, AjaxPatch, AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { TReviewDictionary, TReviewTopic, TReviewWord } from "models/TReview";

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
    direction: "jp_to_ru" | "ru_to_jp";
    assessments: Record<number, TrainingAssessment>;
    startedAt: number;
    elapsedSeconds: number;
    isFinished: boolean;
}

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

    window.speechSynthesis.speak(utterance);
};

const REVIEW_TRAINING_HISTORY_STORAGE_KEY = "viponyata-review-training-history";
const REVIEW_TRAINING_HISTORY_LIMIT = 100;

const isDirectionValue = (value: unknown): value is TrainingSession["direction"] =>
    value === "jp_to_ru" || value === "ru_to_jp";

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

    const routePaths = {
        root: "/review",
        training: "/review/training",
        history: "/review/training/history",
        flashcards: "/review/flashcards",
        results: "/review/results",
    } as const;

    const getDictionaryPath = (dictionaryId: number) => `/review/dictionaries/${dictionaryId}`;
    const getTopicPath = (topicId: number) => `/review/topics/${topicId}`;

    const dictionaryRouteMatch = location.pathname.match(/^\/review\/dictionaries\/(\d+)$/);
    const topicRouteMatch = location.pathname.match(/^\/review\/topics\/(\d+)$/);
    const selectedDictionaryId = dictionaryRouteMatch ? Number(dictionaryRouteMatch[1]) : null;
    const selectedTopicId = topicRouteMatch ? Number(topicRouteMatch[1]) : null;

    const isRootRoute = location.pathname === routePaths.root;
    const isTrainingSetupRoute = location.pathname === routePaths.training;
    const isTrainingHistoryRoute = location.pathname === routePaths.history;
    const isFlashcardsRoute = location.pathname === routePaths.flashcards;
    const isResultsRoute = location.pathname === routePaths.results;

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
    const [trainingDirection, setTrainingDirection] = useState<"jp_to_ru" | "ru_to_jp">("jp_to_ru");
    const [speakJpAfterFlip, setSpeakJpAfterFlip] = useState(false);
    const [autoSpeakCards, setAutoSpeakCards] = useState(false);
    const [trainingSession, setTrainingSession] = useState<TrainingSession | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [openedDetailKeys, setOpenedDetailKeys] = useState<FlashcardDetailKey[]>([]);
    const [trainingHistory, setTrainingHistory] = useState<ReviewTrainingHistoryEntry[]>([]);
    const [hasTrainingHistoryError, setHasTrainingHistoryError] = useState(false);
    const [expandedHistoryEntryId, setExpandedHistoryEntryId] = useState<string | null>(null);

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
        if (trainingSession !== null) {
            const targetPath = trainingSession.isFinished ? routePaths.results : routePaths.flashcards;

            if (location.pathname !== targetPath) {
                navigate(targetPath, { replace: true });
            }

            return;
        }

        if (isFlashcardsRoute || isResultsRoute) {
            navigate(routePaths.training, { replace: true });
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
        navigate(routePaths.root);
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

    const startTraining = (wordIds?: number[], allWordIds?: number[], topicIds?: number[]) => {
        const selectedWordIds =
            wordIds ?? words.filter((word) => selectedTrainingTopicIds.includes(word.topic_id)).map((word) => word.id);
        const sessionTopicIds = topicIds ?? selectedTrainingTopicIds;

        if (selectedWordIds.length === 0) {
            return;
        }

        stopSpeaking();
        setIsFlipped(false);
        setOpenedDetailKeys([]);

        setTrainingSession({
            allWordIds: [...(allWordIds ?? selectedWordIds)],
            initialWordIds: [...selectedWordIds],
            topicIds: [...sessionTopicIds],
            queue: shuffleArray(selectedWordIds),
            openedWordIds: [],
            direction: trainingDirection,
            assessments: {},
            startedAt: Date.now(),
            elapsedSeconds: 0,
            isFinished: false,
        });
    };

    const finishTraining = (nextQueue: number[], nextAssessments: Record<number, TrainingAssessment>) => {
        if (trainingSession === null || trainingSession.isFinished) {
            return;
        }

        stopSpeaking();
        const finishedAt = Date.now();
        const finishedSession = {
            ...trainingSession,
            queue: nextQueue,
            assessments: nextAssessments,
            elapsedSeconds: Math.floor((finishedAt - trainingSession.startedAt) / 1000),
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

        setTrainingSession((prev) => {
            if (prev === null) {
                return prev;
            }

            return {
                ...prev,
                queue: nextQueue,
                assessments: nextAssessments,
                elapsedSeconds: finishedSession.elapsedSeconds,
                isFinished: true,
            };
        });
    };

    const finishCurrentTraining = () => {
        if (trainingSession === null) {
            return;
        }

        finishTraining(trainingSession.queue, trainingSession.assessments);
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
            nextQueue = insertWordLater(queueWithoutCurrent, currentWordId, 2);
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
        setTrainingSession(null);
        setIsFlipped(false);
        setOpenedDetailKeys([]);
        navigate(routePaths.training);
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

    const toggleDetail = (detailKey: FlashcardDetailKey) => {
        setOpenedDetailKeys((prev) =>
            prev.includes(detailKey) ? prev.filter((item) => item !== detailKey) : [...prev, detailKey],
        );
    };

    const toggleHistoryEntry = (entryId: string) => {
        setExpandedHistoryEntryId((prev) => (prev === entryId ? null : entryId));
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
                            onClick={() => navigate(routePaths.root)}
                        >
                            Словари
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={isTrainingSetupRoute}
                            className={`btn quizlet-student-dictionary-tab ${isTrainingSetupRoute ? "active" : ""}`}
                            onClick={() => navigate(routePaths.training)}
                        >
                            Тренировка
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={isTrainingHistoryRoute}
                            className={`btn quizlet-student-dictionary-tab ${isTrainingHistoryRoute ? "active" : ""}`}
                            onClick={() => navigate(routePaths.history)}
                        >
                            История
                        </button>
                    </div>
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
                                    <Link to={routePaths.root}>復習</Link>
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
                                        <Link to={routePaths.root}>復習</Link>
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

            {(isTrainingSetupRoute || isTrainingHistoryRoute) && (
                <div className="review-section-card review-library-container">
                    <div className="review-training-setup">
                        {isTrainingSetupRoute && (
                            <>
                                <section className="review-training-panel">
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

                                    {/* <div className="small text-muted review-training-helper-text">
                                        Без ограничений по повторениям. Повторения для «забыла» и «частично» ставятся в очередь
                                        случайно, но не раньше чем через 8 карточек, если это возможно.
                                    </div> */}
                                </section>

                                <section className="review-training-panel">
                                    <div className="review-training-section-label">Топики</div>
                                    <div className="review-training-topic-list">
                                        {groupedTopics.map(({ dictionary, topics: dictionaryTopics }) => (
                                            <div className="border rounded p-2 mb-2" key={dictionary.id}>
                                                {(() => {
                                                    const dictionaryTopicIds = dictionaryTopics.map(
                                                        (topic) => topic.id,
                                                    );
                                                    const selectedTopicsCount = dictionaryTopicIds.filter((topicId) =>
                                                        selectedTrainingTopicIds.includes(topicId),
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

                                <section className="review-training-panel review-training-panel-start">
                                    <div className="review-training-start-row">
                                        <button
                                            type="button"
                                            className="btn btn-success review-training-start-button"
                                            disabled={selectedTrainingTopicIds.length === 0}
                                            onClick={() => startTraining()}
                                        >
                                            Начать тренировку
                                        </button>
                                        <div className="review-training-selected-count">
                                            Выбрано карточек: <span>{selectedTrainingWordsCount}</span>
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

                        <button
                            type="button"
                            className={`flashcard-card ${isFlipped ? "is-flipped" : ""}`}
                            onClick={() => {
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
                            }}
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
                            забыла
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
                </div>
            )}
        </div>
    );
};

export default TeacherReview;
