import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Loading from "components/Common/Loading";
import ErrorPage from "components/ErrorPages/ErrorPage";
import TrainingSessionHeader from "components/Quizlet/TrainingSessionHeader";
import { AjaxDelete, AjaxGet, AjaxPatch, AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { TReviewDictionary, TReviewTopic, TReviewWord } from "models/TReview";

import "components/Quizlet/FlashcardExercise.css";
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
    initialWordIds: number[];
    queue: number[];
    direction: "jp_to_ru" | "ru_to_jp";
    assessments: Record<number, TrainingAssessment>;
    startedAt: number;
    elapsedSeconds: number;
    isFinished: boolean;
}

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

        const pastedRows: EditorRow[] = text
            .split(/\r?\n/)
            .filter((line) => line.trim() !== "")
            .map((line) => {
                const cells = line.split("\t").map((cell) => cell.trim());

                return {
                    key: makeKey(),
                    source: cells[0] ?? "",
                    word_jp: cells[1] ?? "",
                    ru: cells[2] ?? "",
                    note: cells[3] ?? "",
                    examples: cells[4] ?? "",
                };
            });

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
    const [trainingSession, setTrainingSession] = useState<TrainingSession | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [openedDetailKeys, setOpenedDetailKeys] = useState<Array<"source" | "note" | "examples">>([]);

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

    const startTraining = (wordIds?: number[]) => {
        const selectedWordIds =
            wordIds ?? words.filter((word) => selectedTrainingTopicIds.includes(word.topic_id)).map((word) => word.id);

        if (selectedWordIds.length === 0) {
            return;
        }

        setTrainingSession({
            initialWordIds: [...selectedWordIds],
            queue: shuffleArray(selectedWordIds),
            direction: trainingDirection,
            assessments: {},
            startedAt: Date.now(),
            elapsedSeconds: 0,
            isFinished: false,
        });
    };

    const finishTraining = (nextQueue: number[], nextAssessments: Record<number, TrainingAssessment>) => {
        setTrainingSession((prev) => {
            if (prev === null) {
                return prev;
            }

            return {
                ...prev,
                queue: nextQueue,
                assessments: nextAssessments,
                elapsedSeconds: Math.floor((Date.now() - prev.startedAt) / 1000),
                isFinished: true,
            };
        });
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
        setTrainingSession(null);
        setIsFlipped(false);
        setOpenedDetailKeys([]);
        navigate(routePaths.training);
    };

    const repeatAll = () => {
        if (trainingSession === null) {
            return;
        }

        startTraining(trainingSession.initialWordIds);
    };

    const repeatForgotten = () => {
        if (trainingSession === null) {
            return;
        }

        const forgottenWordIds = trainingSession.initialWordIds.filter((wordId) => {
            const assessment = trainingSession.assessments[wordId];
            return assessment !== undefined && (assessment.forgot > 0 || assessment.partial > 0);
        });

        if (forgottenWordIds.length === 0) {
            return;
        }

        startTraining(forgottenWordIds);
    };

    const resultSummary = useMemo(() => {
        if (trainingSession === null) {
            return { easy: 0, partial: 0, forgot: 0, forgottenIdsCount: 0 };
        }

        let easy = 0;
        let partial = 0;
        let forgot = 0;

        trainingSession.initialWordIds.forEach((wordId) => {
            const assessment = trainingSession.assessments[wordId];

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

        return { easy, partial, forgot, forgottenIdsCount: partial + forgot };
    }, [trainingSession]);

    const trainingIncorrectAnswers = useMemo(() => {
        if (trainingSession === null) {
            return 0;
        }

        return Object.values(trainingSession.assessments).reduce(
            (total, assessment) => total + assessment.forgot + assessment.partial,
            0,
        );
    }, [trainingSession]);

    const trainingCurrentPosition = useMemo(() => {
        if (trainingSession === null) {
            return 1;
        }

        return Math.max(1, trainingSession.initialWordIds.length - trainingSession.queue.length + 1);
    }, [trainingSession]);

    const toggleDetail = (detailKey: "source" | "note" | "examples") => {
        setOpenedDetailKeys((prev) =>
            prev.includes(detailKey) ? prev.filter((item) => item !== detailKey) : [...prev, detailKey],
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
                <div
                    className="quizlet-student-dictionary-tabs"
                    role="tablist"
                    aria-label="Переключение режимов review"
                >
                    <button
                        type="button"
                        role="tab"
                        aria-selected={!isTrainingSetupRoute}
                        className={`btn quizlet-student-dictionary-tab ${!isTrainingSetupRoute ? "active" : ""}`}
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

            {isTrainingSetupRoute && (
                <div className="review-section-card">
                    <div className="review-training-grid">
                        <div>
                            <div className="fw-semibold mb-2">Направление</div>
                            <div className="review-direction-toggle mb-4">
                                <button
                                    type="button"
                                    className={`btn ${trainingDirection === "jp_to_ru" ? "btn-success" : "btn-outline-success"}`}
                                    onClick={() => setTrainingDirection("jp_to_ru")}
                                >
                                    jp → ru
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${trainingDirection === "ru_to_jp" ? "btn-success" : "btn-outline-success"}`}
                                    onClick={() => setTrainingDirection("ru_to_jp")}
                                >
                                    ru → jp
                                </button>
                            </div>

                            <button
                                type="button"
                                className="btn btn-success"
                                disabled={selectedTrainingTopicIds.length === 0}
                                onClick={() => startTraining()}
                            >
                                Начать тренировку
                            </button>
                            <div className="small text-muted mt-2">
                                Без ограничений по повторениям. Повторения для «забыла» и «частично» ставятся в очередь
                                случайно, но не раньше чем через 8 карточек, если это возможно.
                            </div>
                        </div>

                        <div>
                            <div className="fw-semibold mb-2">Топики</div>
                            <div className="review-training-topic-list">
                                {groupedTopics.map(({ dictionary, topics: dictionaryTopics }) => (
                                    <div className="review-training-topic-group" key={dictionary.id}>
                                        <div className="review-training-topic-title">{dictionary.title}</div>
                                        {dictionaryTopics.length === 0 ? (
                                            <div className="small text-muted">Нет топиков</div>
                                        ) : (
                                            dictionaryTopics.map((topic) => {
                                                const topicWordCount = words.filter(
                                                    (word) => word.topic_id === topic.id,
                                                ).length;
                                                return (
                                                    <label
                                                        className="form-check d-flex gap-2 align-items-start"
                                                        key={topic.id}
                                                    >
                                                        <input
                                                            className="form-check-input mt-1"
                                                            type="checkbox"
                                                            checked={selectedTrainingTopicIds.includes(topic.id)}
                                                            onChange={() => toggleTrainingTopic(topic.id)}
                                                        />
                                                        <span>
                                                            <span className="fw-medium">{topic.title}</span>
                                                            <span className="d-block small text-muted">
                                                                {topicWordCount} карточек
                                                            </span>
                                                        </span>
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
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
                            onFinishTraining={resetTraining}
                        />

                        <button
                            type="button"
                            className={`flashcard-card ${isFlipped ? "is-flipped" : ""}`}
                            onClick={() => setIsFlipped((prev) => !prev)}
                        >
                            <div className="flashcard-flip-inner">
                                <div className="flashcard-face flashcard-face-front">
                                    <div className="flashcard-content">
                                        <div
                                            className={`flashcard-main-word ${
                                                trainingSession.direction === "ru_to_jp" ? "flashcard-main-word-ru" : ""
                                            }`}
                                        >
                                            {trainingSession.direction === "jp_to_ru"
                                                ? currentWord.word_jp
                                                : currentWord.ru}
                                        </div>
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

                                        <div className="review-flashcard-extra-zone">
                                            <div className="review-flashcard-extra-toggle">
                                                {currentWord.source && (
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
                                                {currentWord.note && (
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
                                                {currentWord.examples && (
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
                                                {openedDetailKeys.includes("source") && currentWord.source && (
                                                    <div className="review-flashcard-extra-item">
                                                        <div className="small text-muted mb-1">Источник</div>
                                                        <div>{currentWord.source}</div>
                                                    </div>
                                                )}
                                                {openedDetailKeys.includes("note") && currentWord.note && (
                                                    <div className="review-flashcard-extra-item">
                                                        <div className="small text-muted mb-1">Примечание</div>
                                                        <div>{currentWord.note}</div>
                                                    </div>
                                                )}
                                                {openedDetailKeys.includes("examples") && currentWord.examples && (
                                                    <div className="review-flashcard-extra-item">
                                                        <div className="small text-muted mb-1">Примеры</div>
                                                        <div style={{ whiteSpace: "pre-wrap" }}>
                                                            {currentWord.examples}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
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
                <div className="review-section-card" style={{ maxWidth: "860px", margin: "28px auto 0" }}>
                    <h3 className="mb-2">Результаты</h3>
                    <div className="text-muted">Тренировка завершена за {trainingSession.elapsedSeconds} сек.</div>

                    <div className="review-results-grid">
                        <div className="review-results-card">
                            <div className="small text-muted">Помню сразу</div>
                            <div className="fs-3 fw-semibold">{resultSummary.easy}</div>
                        </div>
                        <div className="review-results-card">
                            <div className="small text-muted">Частично</div>
                            <div className="fs-3 fw-semibold">{resultSummary.partial}</div>
                        </div>
                        <div className="review-results-card">
                            <div className="small text-muted">Забыла</div>
                            <div className="fs-3 fw-semibold">{resultSummary.forgot}</div>
                        </div>
                    </div>

                    <div className="review-flashcard-actions justify-content-start">
                        <button
                            type="button"
                            className="btn btn-warning"
                            disabled={resultSummary.forgottenIdsCount === 0}
                            onClick={repeatForgotten}
                        >
                            повторить забытое
                        </button>
                        <button type="button" className="btn btn-success" onClick={repeatAll}>
                            повторить всё
                        </button>
                        <button type="button" className="btn btn-outline-secondary" onClick={resetTraining}>
                            к выбору топиков
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherReview;
