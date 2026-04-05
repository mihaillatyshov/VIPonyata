import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Loading from "components/Common/Loading";
import PageTitle from "components/Common/PageTitle";
import ErrorPage from "components/ErrorPages/ErrorPage";
import { AjaxDelete, AjaxGet, AjaxPatch, AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import {
    TQuizletGroup,
    TQuizletLesson,
    TQuizletSession,
    TQuizletSessionWord,
    TQuizletSubgroup,
    TQuizletSubgroupWord,
    TQuizletWord,
} from "models/TQuizlet";

import FlashcardExercise from "./FlashcardExercise";
import MatchingExercise from "./MatchingExercise";

import "./QuizletShared.css";

import QuizletProgressHistory from "./QuizletProgressHistory";
import QuizletQuizStart from "./QuizletQuizStart";
import QuizletSessionResults from "./QuizletSessionResults";
import { parseQueue } from "./quizletUtils";
import TrainingSessionHeader from "./TrainingSessionHeader";

interface CatalogResponse {
    groups: TQuizletGroup[];
    subgroups: TQuizletSubgroup[];
    subgroup_words: TQuizletSubgroupWord[];
    words: TQuizletWord[];
}

interface PersonalResponse {
    lesson: TQuizletLesson | null;
    subgroups: TQuizletSubgroup[];
    words: TQuizletWord[];
}

interface SessionResponse {
    session: TQuizletSession & { queue_state?: string };
    words: TQuizletSessionWord[];
}

interface ActiveSessionResponse {
    session: (TQuizletSession & { queue_state?: string }) | null;
}

interface EditorRow {
    key: string;
    id?: number;
    char_jp: string;
    word_jp: string;
    ru: string;
}

type CommittedWords = Map<number, { char_jp: string | null; word_jp: string; ru: string }>;

const COLS = ["char_jp", "word_jp", "ru"] as const;
type ColField = (typeof COLS)[number];

let _keyCounter = 0;
const makeKey = () => `row_${++_keyCounter}`;
const makeEmptyRow = (): EditorRow => ({ key: makeKey(), char_jp: "", word_jp: "", ru: "" });

const wordsToRows = (words: TQuizletWord[]): EditorRow[] =>
    words.map((w) => ({ key: makeKey(), id: w.id, char_jp: w.char_jp ?? "", word_jp: w.word_jp, ru: w.ru }));

const isAllEmpty = (row: EditorRow) => row.char_jp.trim() === "" && row.word_jp.trim() === "" && row.ru.trim() === "";

const isJpEmpty = (row: EditorRow) => row.char_jp.trim() === "" && row.word_jp.trim() === "";

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

interface PersonalTopicEditorProps {
    subgroup: TQuizletSubgroup;
    initialWords: TQuizletWord[];
    onSaved: () => void;
}

const PersonalTopicEditor = ({ subgroup, initialWords, onSaved }: PersonalTopicEditorProps) => {
    const [rows, setRows] = useState<EditorRow[]>(() =>
        initialWords.length > 0 ? wordsToRows(initialWords) : [makeEmptyRow()],
    );
    const [deletedIds, setDeletedIds] = useState<number[]>([]);
    const [committedWords, setCommittedWords] = useState<CommittedWords>(
        () => new Map(initialWords.map((w) => [w.id, { char_jp: w.char_jp, word_jp: w.word_jp, ru: w.ru }])),
    );
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const tableRef = useRef<HTMLTableElement>(null);
    const focusPending = useRef<{ rowIndex: number; col: number } | null>(null);

    useEffect(() => {
        setRows(initialWords.length > 0 ? wordsToRows(initialWords) : [makeEmptyRow()]);
        setDeletedIds([]);
        setCommittedWords(
            new Map(initialWords.map((w) => [w.id, { char_jp: w.char_jp, word_jp: w.word_jp, ru: w.ru }])),
        );
    }, [subgroup.id, initialWords]);

    useLayoutEffect(() => {
        if (!focusPending.current) return;
        const { rowIndex, col } = focusPending.current;
        focusPending.current = null;
        const tbody = tableRef.current?.querySelector("tbody");
        if (!tbody) return;
        const input = tbody.rows[rowIndex]?.cells[col]?.querySelector<HTMLInputElement>("input");
        input?.focus();
        input?.select();
    }, [rows]);

    const requestFocus = (rowIndex: number, col: number) => {
        focusPending.current = { rowIndex, col };
    };

    const rowFlags = useMemo(() => {
        const flags = new Map<string, { danger: boolean; warning: boolean }>();
        const charSeen = new Map<string, string>();
        const kanaSeen = new Map<string, string>();

        for (const row of rows) {
            let danger = false;
            let warning = false;

            if (!isAllEmpty(row) && isJpEmpty(row)) {
                danger = true;
            }

            if (!isAllEmpty(row) && !isJpEmpty(row)) {
                const cj = row.char_jp.trim();
                const wj = row.word_jp.trim();

                if (cj) {
                    if (charSeen.has(cj)) {
                        warning = true;
                        const first = charSeen.get(cj)!;
                        const prev = flags.get(first);
                        if (prev) flags.set(first, { ...prev, warning: true });
                    } else {
                        charSeen.set(cj, row.key);
                    }
                }

                if (wj) {
                    if (kanaSeen.has(wj)) {
                        warning = true;
                        const first = kanaSeen.get(wj)!;
                        const prev = flags.get(first);
                        if (prev) flags.set(first, { ...prev, warning: true });
                    } else {
                        kanaSeen.set(wj, row.key);
                    }
                }
            }

            flags.set(row.key, { danger, warning });
        }

        return flags;
    }, [rows]);

    const isDirty = useMemo(() => {
        if (deletedIds.length > 0) return true;
        const currentIds = new Set<number>();

        for (const row of rows) {
            if (isAllEmpty(row)) continue;
            if (row.id === undefined) return true;
            currentIds.add(row.id);
            const orig = committedWords.get(row.id);
            if (!orig) return true;
            if ((orig.char_jp ?? "") !== row.char_jp || orig.word_jp !== row.word_jp || orig.ru !== row.ru) return true;
        }

        for (const id of Array.from(committedWords.keys())) {
            if (!currentIds.has(id)) return true;
        }

        return false;
    }, [rows, deletedIds, committedWords]);

    const hasIssues = Array.from(rowFlags.values()).some((f) => f.danger || f.warning);

    const updateCell = (rowKey: string, field: ColField, value: string) => {
        setRows((prev) => prev.map((r) => (r.key === rowKey ? { ...r, [field]: value } : r)));
    };

    const addRowAfter = (afterIndex: number) => {
        const newRow = makeEmptyRow();
        setRows((prev) => {
            const next = [...prev];
            next.splice(afterIndex + 1, 0, newRow);
            return next;
        });
        requestFocus(afterIndex + 1, 0);
    };

    const removeRow = (rowIndex: number) => {
        const row = rows[rowIndex];
        if (row.id !== undefined) {
            setDeletedIds((prev) => [...prev, row.id!]);
        }
        setRows((prev) => {
            const next = prev.filter((_, i) => i !== rowIndex);
            return next.length === 0 ? [makeEmptyRow()] : next;
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (rowIndex === rows.length - 1) {
                addRowAfter(rowIndex);
            } else {
                requestFocus(rowIndex + 1, 0);
                setRows((prev) => [...prev]);
            }
        } else if (e.key === "Tab") {
            const nextCol = colIndex + (e.shiftKey ? -1 : 1);

            if (nextCol >= 0 && nextCol < COLS.length) {
                e.preventDefault();
                requestFocus(rowIndex, nextCol);
                setRows((prev) => [...prev]);
            } else if (!e.shiftKey && nextCol >= COLS.length) {
                e.preventDefault();
                if (rowIndex < rows.length - 1) {
                    requestFocus(rowIndex + 1, 0);
                    setRows((prev) => [...prev]);
                } else {
                    addRowAfter(rowIndex);
                }
            } else if (e.shiftKey && nextCol < 0 && rowIndex > 0) {
                e.preventDefault();
                requestFocus(rowIndex - 1, COLS.length - 1);
                setRows((prev) => [...prev]);
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTableElement>) => {
        const text = e.clipboardData.getData("text");
        if (!text.includes("\t") && !text.includes("\n")) return;
        e.preventDefault();

        const pasted: EditorRow[] = text
            .split(/\r?\n/)
            .filter((line) => line.trim() !== "")
            .map((line) => {
                const cells = line.split("\t").map((c) => c.trim());
                return { key: makeKey(), char_jp: cells[0] ?? "", word_jp: cells[1] ?? "", ru: cells[2] ?? "" };
            });

        if (pasted.length === 0) return;

        setRows((prev) => {
            const nonEmpty = prev.filter((r) => !isAllEmpty(r));
            return [...nonEmpty, ...pasted];
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(null);
        try {
            for (const id of deletedIds) {
                await AjaxDelete({ url: `/api/quizlet/personal/words/${id}` });
            }

            const nonEmpty = rows.filter((r) => !isAllEmpty(r));
            const toCreate = nonEmpty.filter((r) => r.id === undefined);
            const toUpdate = nonEmpty.filter((r) => {
                if (r.id === undefined) return false;
                const orig = committedWords.get(r.id);
                if (!orig) return false;
                return (orig.char_jp ?? "") !== r.char_jp || orig.word_jp !== r.word_jp || orig.ru !== r.ru;
            });

            const created: TQuizletWord[] = [];
            for (const row of toCreate) {
                const resp = await AjaxPost<{ word: TQuizletWord }>({
                    url: "/api/quizlet/personal/words",
                    body: {
                        subgroup_id: subgroup.id,
                        char_jp: row.char_jp.trim() || null,
                        word_jp: row.word_jp,
                        ru: row.ru,
                    },
                });
                created.push(resp.word);
            }

            for (const row of toUpdate) {
                await AjaxPatch({
                    url: `/api/quizlet/personal/words/${row.id}`,
                    body: { char_jp: row.char_jp.trim() || null, word_jp: row.word_jp, ru: row.ru },
                });
            }

            let createIdx = 0;
            const updatedRows = rows.map((row) => {
                if (!isAllEmpty(row) && row.id === undefined && createIdx < created.length) {
                    return { ...row, id: created[createIdx++].id };
                }
                return row;
            });
            setRows(updatedRows);
            setDeletedIds([]);

            const newCommitted: CommittedWords = new Map();
            for (const row of updatedRows) {
                if (!isAllEmpty(row) && row.id !== undefined) {
                    newCommitted.set(row.id, {
                        char_jp: row.char_jp.trim() || null,
                        word_jp: row.word_jp,
                        ru: row.ru,
                    });
                }
            }
            setCommittedWords(newCommitted);
            onSaved();
        } catch {
            setSaveError("Ошибка при сохранении");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="quizlet-personal-topic-editor">
            <div className="table-responsive quizlet-personal-topic-editor-table-wrap">
                <table
                    ref={tableRef}
                    className="table table-sm table-bordered align-middle mb-1 quizlet-personal-topic-editor-table"
                    onPaste={handlePaste}
                >
                    <thead>
                        <tr className="table-light">
                            <th className="quizlet-dictionary-table-head" style={{ width: "28%" }}>
                                Кандзи
                            </th>
                            <th className="quizlet-dictionary-table-head" style={{ width: "28%" }}>
                                Чтение
                            </th>
                            <th className="quizlet-dictionary-table-head" style={{ width: "37%" }}>
                                Перевод
                            </th>
                            <th style={{ width: "5%" }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => {
                            const flag = rowFlags.get(row.key) ?? { danger: false, warning: false };
                            const rowClass = flag.danger ? "table-danger" : flag.warning ? "table-warning" : "";

                            return (
                                <tr key={row.key} className={rowClass}>
                                    {COLS.map((field, colIndex) => (
                                        <td key={field} className="p-0">
                                            <input
                                                type="text"
                                                className="form-control form-control-sm border-0 rounded-0 shadow-none quizlet-personal-topic-editor-input"
                                                style={{ background: "transparent" }}
                                                value={row[field]}
                                                onChange={(e) => updateCell(row.key, field, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                                                placeholder={
                                                    field === "char_jp"
                                                        ? "漢字"
                                                        : field === "word_jp"
                                                        ? "かな"
                                                        : "перевод"
                                                }
                                            />
                                        </td>
                                    ))}
                                    <td className="text-center p-0">
                                        <button
                                            className="btn btn-sm btn-link text-danger p-1 lh-1 quizlet-personal-topic-row-delete-btn"
                                            onClick={() => removeRow(rowIndex)}
                                            title="Удалить строку"
                                        >
                                            ×
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-1">
                <button className="btn btn-sm btn-outline-secondary" onClick={() => addRowAfter(rows.length - 1)}>
                    + Добавить строку
                </button>
                <div className="d-flex align-items-center gap-2">
                    {saveError && <span className="text-danger small">{saveError}</span>}
                    {hasIssues && (
                        <span className="text-warning small">
                            <i className="bi bi-exclamation-triangle me-1" />
                            Есть проблемы
                        </span>
                    )}
                    <button className="btn btn-success" onClick={handleSave} disabled={isSaving || !isDirty}>
                        {isSaving ? "Сохранение..." : "Сохранить"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const StudentQuizlet = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const routePaths = {
        modeSelection: "/quizlet",
        setup: "/quizlet/setup",
        flashcards: "/quizlet/flashcards",
        pairs: "/quizlet/pairs",
        results: "/quizlet/results",
        view: "/quizlet/view",
        personalDictionary: "/quizlet/my-dictionary",
        progress: "/quizlet/progress",
    } as const;

    const getPersonalTopicPath = (topicId: number) => `${routePaths.personalDictionary}/topics/${topicId}`;

    const getViewLessonPath = (lessonId: number) => `${routePaths.view}/lessons/${lessonId}`;
    const getViewTopicPath = (lessonId: number, topicId: number) =>
        `${routePaths.view}/lessons/${lessonId}/topics/${topicId}`;

    const [loadStatus, setLoadStatus] = useState<LoadStatus.Type>(LoadStatus.NONE);
    const [mode, setMode] = useState<"training" | "view" | "personal" | "progress" | null>(null);

    const [groups, setGroups] = useState<TQuizletGroup[]>([]);
    const [subgroups, setSubgroups] = useState<TQuizletSubgroup[]>([]);
    const [subgroupWords, setSubgroupWords] = useState<TQuizletSubgroupWord[]>([]);
    const [words, setWords] = useState<TQuizletWord[]>([]);

    const [personalLesson, setPersonalLesson] = useState<TQuizletLesson | null>(null);
    const [personalSubgroups, setPersonalSubgroups] = useState<TQuizletSubgroup[]>([]);
    const [personalWords, setPersonalWords] = useState<TQuizletWord[]>([]);

    const [session, setSession] = useState<(TQuizletSession & { queue_state?: string }) | null>(null);
    const [sessionWords, setSessionWords] = useState<TQuizletSessionWord[]>([]);
    const [activeSession, setActiveSession] = useState<(TQuizletSession & { queue_state?: string }) | null>(null);
    const [activeSessionLoadStatus, setActiveSessionLoadStatus] = useState<LoadStatus.Type>(LoadStatus.NONE);
    const [isFinishingActiveSession, setIsFinishingActiveSession] = useState<boolean>(false);
    const autoFinishSessionIdRef = useRef<number | null>(null);
    const timerSessionIdRef = useRef<number | null>(null);
    const queueRef = useRef<number[]>([]);
    const [liveElapsedSeconds, setLiveElapsedSeconds] = useState<number>(0);

    const [matchingPageInfo, setMatchingPageInfo] = useState<{ currentPage: number; totalPages: number }>({
        currentPage: 1,
        totalPages: 1,
    });

    const [personalLessonTitle, setPersonalLessonTitle] = useState<string>("");
    const [newPersonalTopicTitle, setNewPersonalTopicTitle] = useState<string>("");
    const [isEditingLessonTitle, setIsEditingLessonTitle] = useState(false);
    const [selectedPersonalTopicId, setSelectedPersonalTopicId] = useState<number | null>(null);
    const [isEditingPersonalTopicTitle, setIsEditingPersonalTopicTitle] = useState(false);
    const [personalTopicTitleDraft, setPersonalTopicTitleDraft] = useState<string>("");
    const [isDeleteTopicConfirming, setIsDeleteTopicConfirming] = useState(false);

    const [historySessions, setHistorySessions] = useState<TQuizletSession[]>([]);
    const [historyLoadStatus, setHistoryLoadStatus] = useState<LoadStatus.Type>(LoadStatus.NONE);
    const [expandedHistorySessionId, setExpandedHistorySessionId] = useState<number | null>(null);
    const [historySessionWordsById, setHistorySessionWordsById] = useState<Record<number, TQuizletSessionWord[]>>({});
    const [historyLoadingDetailsSessionId, setHistoryLoadingDetailsSessionId] = useState<number | null>(null);
    const viewedFlashcardIdsRef = useRef<Set<number>>(new Set());

    const [lastStartPayload, setLastStartPayload] = useState<any>(null);

    const isModeSelectionRoute = location.pathname === routePaths.modeSelection;
    const isSetupRoute = location.pathname === routePaths.setup;
    const isFlashcardsRoute = location.pathname === routePaths.flashcards;
    const isPairsRoute = location.pathname === routePaths.pairs;
    const isResultsRoute = location.pathname === routePaths.results;
    const viewLessonRouteMatch = location.pathname.match(/^\/quizlet\/view\/lessons\/(\d+)$/);
    const viewLessonRouteId = viewLessonRouteMatch ? Number(viewLessonRouteMatch[1]) : null;
    const viewTopicRouteMatch = location.pathname.match(/^\/quizlet\/view\/lessons\/(\d+)\/topics\/(\d+)$/);
    const viewTopicLessonRouteId = viewTopicRouteMatch ? Number(viewTopicRouteMatch[1]) : null;
    const viewTopicRouteId = viewTopicRouteMatch ? Number(viewTopicRouteMatch[2]) : null;
    const isViewRoute =
        location.pathname === routePaths.view || viewLessonRouteId !== null || viewTopicRouteId !== null;
    const isPersonalDictionaryRoute = location.pathname === routePaths.personalDictionary;
    const personalTopicRouteMatch = location.pathname.match(/^\/quizlet\/my-dictionary\/topics\/(\d+)$/);
    const personalTopicRouteId = personalTopicRouteMatch ? Number(personalTopicRouteMatch[1]) : null;
    const isPersonalTopicRoute = personalTopicRouteId !== null;
    const isProgressRoute = location.pathname === routePaths.progress;

    const fetchCatalog = () => {
        return AjaxGet<CatalogResponse>({ url: "/api/quizlet/groups" }).then((json) => {
            setGroups(json.groups);
            setSubgroups(json.subgroups);
            setSubgroupWords(json.subgroup_words);
            setWords(json.words);
        });
    };

    const fetchPersonal = () => {
        return AjaxGet<PersonalResponse>({ url: "/api/quizlet/personal" }).then((json) => {
            setPersonalLesson(json.lesson);
            setPersonalSubgroups(json.subgroups);
            setPersonalWords(json.words);
        });
    };

    const loadData = () => {
        setLoadStatus(LoadStatus.LOADING);
        Promise.all([fetchCatalog(), fetchPersonal()])
            .then(() => setLoadStatus(LoadStatus.DONE))
            .catch(() => setLoadStatus(LoadStatus.ERROR));
    };

    const loadHistory = () => {
        setHistoryLoadStatus(LoadStatus.LOADING);
        AjaxGet<{ sessions: TQuizletSession[] }>({ url: "/api/quizlet/sessions/stats" })
            .then((json) => {
                setHistorySessions(json.sessions.filter((item) => item.is_finished));
                setHistoryLoadStatus(LoadStatus.DONE);
            })
            .catch(() => {
                setHistoryLoadStatus(LoadStatus.ERROR);
            });
    };

    const fetchActiveSession = () => {
        setActiveSessionLoadStatus(LoadStatus.LOADING);
        AjaxGet<ActiveSessionResponse>({ url: "/api/quizlet/sessions/active" })
            .then((json) => {
                setActiveSession(json.session);
                setActiveSessionLoadStatus(LoadStatus.DONE);
            })
            .catch(() => {
                // Fallback for environments where the new endpoint is not yet available
                // (e.g. backend dev server did not reload routes).
                AjaxGet<{ sessions: TQuizletSession[] }>({ url: "/api/quizlet/sessions/stats" })
                    .then((json) => {
                        const unfinished = json.sessions.find((item) => !item.is_finished) ?? null;
                        setActiveSession(unfinished);
                        setActiveSessionLoadStatus(LoadStatus.DONE);
                    })
                    .catch(() => {
                        setActiveSession(null);
                        setActiveSessionLoadStatus(LoadStatus.ERROR);
                    });
            });
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (isSetupRoute) {
            setMode("training");
            return;
        }

        if (isViewRoute) {
            setMode("view");
            return;
        }

        if (isPersonalDictionaryRoute || isPersonalTopicRoute) {
            setMode("personal");
            return;
        }

        if (isProgressRoute) {
            setMode("progress");
            return;
        }

        setMode(null);
    }, [isSetupRoute, isViewRoute, isPersonalDictionaryRoute, isPersonalTopicRoute, isProgressRoute]);

    useEffect(() => {
        if (session !== null) {
            if (session.is_finished && isModeSelectionRoute) {
                setSession(null);
                setSessionWords([]);
                return;
            }

            const targetPath = session.is_finished
                ? routePaths.results
                : session.quiz_type === "flashcards"
                ? routePaths.flashcards
                : routePaths.pairs;

            if (location.pathname !== targetPath) {
                navigate(targetPath, { replace: true });
            }
            return;
        }

        if (isFlashcardsRoute || isPairsRoute || isResultsRoute) {
            navigate(routePaths.setup, { replace: true });
        }
    }, [
        session,
        location.pathname,
        isModeSelectionRoute,
        isFlashcardsRoute,
        isPairsRoute,
        isResultsRoute,
        navigate,
        routePaths.flashcards,
        routePaths.pairs,
        routePaths.results,
        routePaths.setup,
    ]);

    useEffect(() => {
        setSelectedPersonalTopicId(null);
        setIsEditingLessonTitle(false);
        setIsEditingPersonalTopicTitle(false);
        setPersonalTopicTitleDraft("");
        setIsDeleteTopicConfirming(false);
        setExpandedHistorySessionId(null);
    }, [mode]);

    useEffect(() => {
        if (isPersonalDictionaryRoute) {
            setSelectedPersonalTopicId(null);
            setIsDeleteTopicConfirming(false);
            return;
        }

        if (personalTopicRouteId !== null) {
            setSelectedPersonalTopicId(personalTopicRouteId);
            setIsDeleteTopicConfirming(false);
        }
    }, [isPersonalDictionaryRoute, personalTopicRouteId]);

    useEffect(() => {
        viewedFlashcardIdsRef.current.clear();
    }, [session?.id]);

    useEffect(() => {
        if (mode === "progress") {
            loadHistory();
        }
    }, [mode]);

    useEffect(() => {
        if (!isSetupRoute || session !== null) {
            return;
        }

        fetchActiveSession();
    }, [isSetupRoute, session]);

    const loadSession = (sessionId: number) => {
        AjaxGet<SessionResponse>({ url: `/api/quizlet/sessions/${sessionId}` })
            .then((json) => {
                setSession(json.session);
                setSessionWords(json.words);
            })
            .catch(() => {
                setSession(null);
                setSessionWords([]);
            });
    };

    const queue = useMemo(() => {
        if (session === null) {
            return [] as number[];
        }

        const validWordIds = new Set(sessionWords.map((word) => word.id));
        const persistedQueue = parseQueue(session as any).filter((wordId) => validWordIds.has(wordId));

        if (persistedQueue.length > 0) {
            return persistedQueue;
        }

        return sessionWords.filter((word) => !word.is_correct).map((word) => word.id);
    }, [session, sessionWords]);

    useEffect(() => {
        queueRef.current = queue;
    }, [queue]);

    const startSession = (payload: any) => {
        setLastStartPayload(payload);
        setActiveSession(null);
        autoFinishSessionIdRef.current = null;
        AjaxPost<{ session: TQuizletSession }>({ url: "/api/quizlet/sessions/start", body: payload }).then((json) => {
            navigate(payload.quiz_type === "flashcards" ? routePaths.flashcards : routePaths.pairs);
            loadSession(json.session.id);
        });
    };

    const continueSession = () => {
        if (activeSession === null || activeSession.is_finished) {
            return;
        }

        autoFinishSessionIdRef.current = null;
        loadSession(activeSession.id);
    };

    const finishActiveSession = async () => {
        if (activeSession === null || activeSession.is_finished || isFinishingActiveSession) {
            return;
        }

        setIsFinishingActiveSession(true);
        try {
            await AjaxPost({
                url: `/api/quizlet/sessions/${activeSession.id}/end`,
                body: { force_finish: true },
            });
            fetchActiveSession();
        } finally {
            setIsFinishingActiveSession(false);
        }
    };

    const endNow = () => {
        if (session === null) {
            return;
        }
        AjaxPost<{ session: TQuizletSession }>({
            url: `/api/quizlet/sessions/${session.id}/end`,
            body: { force_finish: true },
        }).then((json) => {
            setSession({ ...json.session, is_finished: true });
            loadSession(json.session.id);
        });
    };

    const retryIncorrect = () => {
        if (session === null) {
            return;
        }
        AjaxPost<{ session: TQuizletSession }>({
            url: "/api/quizlet/sessions/retry-incorrect",
            body: { source_session_id: session.id },
        })
            .then((json) => loadSession(json.session.id))
            .catch(() => undefined);
    };

    const retryAll = () => {
        if (lastStartPayload !== null) {
            startSession(lastStartPayload);
        }
    };

    const submitPairAttempt = async (leftWordId: number, rightWordId: number) => {
        if (session === null) {
            return false;
        }

        try {
            const response = await AjaxPost<{ is_correct: boolean }>({
                url: `/api/quizlet/sessions/${session.id}/pair-attempt`,
                body: {
                    left_word_id: leftWordId,
                    right_word_id: rightWordId,
                },
            });
            loadSession(session.id);
            return response.is_correct;
        } catch {
            return false;
        }
    };

    const submitFlashcard = async (wordId: number, recognized: boolean) => {
        if (session === null) {
            return;
        }

        // Finish session when answering the last word in queue
        // - if correct answer (recognized=true)
        // - OR if incorrect answer (recognized=false) on the last word ("Не помню")
        const shouldFinishAfterAnswer = queue.length === 1 && queue[0] === wordId;

        await AjaxPost({
            url: `/api/quizlet/sessions/${session.id}/flashcard-answer`,
            body: {
                session_word_id: wordId,
                recognized,
            },
        });

        if (shouldFinishAfterAnswer) {
            autoFinishSessionIdRef.current = session.id;
            await AjaxPost({
                url: `/api/quizlet/sessions/${session.id}/end`,
                body: { force_finish: false },
            });
        }

        loadSession(session.id);
    };

    const markFlashcardVisible = (wordId: number) => {
        if (session === null || viewedFlashcardIdsRef.current.has(wordId)) {
            return;
        }

        viewedFlashcardIdsRef.current.add(wordId);

        AjaxPost({
            url: `/api/quizlet/sessions/${session.id}/flashcard-viewed`,
            body: {
                session_word_id: wordId,
            },
        }).catch(() => {
            viewedFlashcardIdsRef.current.delete(wordId);
        });
    };

    const ensurePersonalLesson = () => {
        if (personalLessonTitle.trim().length === 0) {
            return;
        }

        const endpoint = "/api/quizlet/personal";
        const method = personalLesson === null ? AjaxPost : AjaxPatch;

        method({ url: endpoint, body: { title: personalLessonTitle } }).then(() => {
            setIsEditingLessonTitle(false);
            fetchPersonal();
        });
    };

    const addPersonalSubgroup = () => {
        if (newPersonalTopicTitle.trim().length === 0) {
            return;
        }

        AjaxPost<{ subgroup: TQuizletSubgroup }>({
            url: "/api/quizlet/personal/subgroups",
            body: { title: newPersonalTopicTitle },
        }).then((resp) => {
            const newId = resp.subgroup?.id;
            setNewPersonalTopicTitle("");
            fetchPersonal().then(() => {
                if (newId !== undefined) {
                    navigate(getPersonalTopicPath(newId));
                }
            });
        });
    };

    const renamePersonalTopic = async (subgroup: TQuizletSubgroup, title: string) => {
        if (!title || title.trim().length === 0) return;
        await AjaxPatch({ url: `/api/quizlet/personal/subgroups/${subgroup.id}`, body: { title: title.trim() } });
        setIsEditingPersonalTopicTitle(false);
        fetchPersonal();
    };

    const deletePersonalTopic = async (subgroup: TQuizletSubgroup) => {
        await AjaxDelete({ url: `/api/quizlet/personal/subgroups/${subgroup.id}` });
        fetchPersonal();
    };

    const finishAndBackToStart = () => {
        autoFinishSessionIdRef.current = null;
        setSession(null);
        setSessionWords([]);
        navigate(routePaths.modeSelection);
    };

    const loadHistorySessionWords = (sessionId: number) => {
        setHistoryLoadingDetailsSessionId(sessionId);
        AjaxGet<SessionResponse>({ url: `/api/quizlet/sessions/${sessionId}` })
            .then((json) => {
                setHistorySessionWordsById((prev) => ({ ...prev, [sessionId]: json.words }));
            })
            .finally(() => {
                setHistoryLoadingDetailsSessionId((current) => (current === sessionId ? null : current));
            });
    };

    const toggleHistorySession = (sessionId: number) => {
        if (expandedHistorySessionId === sessionId) {
            setExpandedHistorySessionId(null);
            return;
        }

        setExpandedHistorySessionId(sessionId);

        if (historySessionWordsById[sessionId] === undefined) {
            loadHistorySessionWords(sessionId);
        }
    };

    const unresolvedCount = sessionWords.filter((word) => !word.is_correct).length;

    const subgroupTitleById = useMemo(() => {
        return new Map(subgroups.map((subgroup) => [subgroup.id, subgroup.title]));
    }, [subgroups]);

    const personalSubgroupTitleById = useMemo(() => {
        return new Map(personalSubgroups.map((subgroup) => [subgroup.id, subgroup.title]));
    }, [personalSubgroups]);

    const teacherWordTopicsMap = useMemo(() => {
        const map = new Map<number, string[]>();

        subgroupWords.forEach((link) => {
            const subgroupTitle = subgroupTitleById.get(link.subgroup_id);
            if (!subgroupTitle) return;

            const existing = map.get(link.word_id) ?? [];
            if (!existing.includes(subgroupTitle)) {
                map.set(link.word_id, [...existing, subgroupTitle]);
            }
        });

        return map;
    }, [subgroupWords, subgroupTitleById]);

    const personalWordTopicsMap = useMemo(() => {
        const map = new Map<number, string[]>();

        personalWords.forEach((word) => {
            const subgroupId = word.subgroup_id;
            if (subgroupId === undefined) return;
            const subgroupTitle = personalSubgroupTitleById.get(subgroupId);
            if (!subgroupTitle) return;

            const existing = map.get(word.id) ?? [];
            if (!existing.includes(subgroupTitle)) {
                map.set(word.id, [...existing, subgroupTitle]);
            }
        });

        return map;
    }, [personalWords, personalSubgroupTitleById]);

    const getTopicsFromSessionWords = (sessionWordsList: TQuizletSessionWord[]) => {
        const topics = new Set<string>();

        sessionWordsList.forEach((word) => {
            const teacherTopics = teacherWordTopicsMap.get(word.source_word_id) ?? [];
            const personalTopics = personalWordTopicsMap.get(word.source_word_id) ?? [];

            teacherTopics.forEach((topic) => topics.add(topic));
            personalTopics.forEach((topic) => topics.add(topic));
        });

        return Array.from(topics);
    };

    useEffect(() => {
        if (personalLesson !== null && personalLessonTitle.trim().length === 0) {
            setPersonalLessonTitle(personalLesson.title);
        }
    }, [personalLesson]);

    useEffect(() => {
        const subgroup =
            selectedPersonalTopicId !== null
                ? personalSubgroups.find((item) => item.id === selectedPersonalTopicId) ?? null
                : null;
        if (subgroup !== null) {
            setIsEditingLessonTitle(false);
            setPersonalTopicTitleDraft(subgroup.title);
        } else {
            setPersonalTopicTitleDraft("");
            setIsEditingPersonalTopicTitle(false);
        }
    }, [selectedPersonalTopicId, personalSubgroups]);

    useEffect(() => {
        if (session === null || session.is_finished) {
            return;
        }

        const intervalId = setInterval(() => {
            AjaxPost({
                url: `/api/quizlet/sessions/${session.id}/save-progress`,
                body: { queue },
            }).catch(() => undefined);
        }, 10000);

        return () => clearInterval(intervalId);
    }, [session, queue]);

    useEffect(() => {
        if (session === null || session.is_finished) {
            return;
        }

        const sessionId = session.id;
        const persistProgress = () => {
            AjaxPost({
                url: `/api/quizlet/sessions/${sessionId}/save-progress`,
                body: { queue: queueRef.current },
            }).catch(() => undefined);
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
    }, [session?.id, session?.is_finished]);

    useEffect(() => {
        if (
            session === null ||
            session.is_finished ||
            session.quiz_type !== "flashcards" ||
            unresolvedCount !== 0 ||
            autoFinishSessionIdRef.current === session.id
        ) {
            return;
        }

        autoFinishSessionIdRef.current = session.id;
        AjaxPost<{ session: TQuizletSession }>({
            url: `/api/quizlet/sessions/${session.id}/end`,
            body: { force_finish: false },
        })
            .then(() => loadSession(session.id))
            .catch(() => {
                autoFinishSessionIdRef.current = null;
            });
    }, [session, unresolvedCount]);

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

    useEffect(() => {
        if (session === null || session.is_finished) {
            return;
        }

        const intervalId = window.setInterval(() => {
            setLiveElapsedSeconds((prev) => prev + 1);
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [session?.id, session?.is_finished]);

    useEffect(() => {
        if (
            session === null ||
            session.is_finished ||
            session.quiz_type !== "pair" ||
            unresolvedCount !== 0 ||
            autoFinishSessionIdRef.current === session.id
        ) {
            return;
        }

        autoFinishSessionIdRef.current = session.id;
        AjaxPost<{ session: TQuizletSession }>({
            url: `/api/quizlet/sessions/${session.id}/end`,
            body: { force_finish: false },
        })
            .then(() => loadSession(session.id))
            .catch(() => {
                autoFinishSessionIdRef.current = null;
            });
    }, [session, unresolvedCount]);

    if (loadStatus === LoadStatus.ERROR) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Не удалось загрузить Quizlet"
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (loadStatus !== LoadStatus.DONE) {
        return <Loading />;
    }

    const getSubgroupWords = (subgroupId: number): TQuizletWord[] => {
        const ids = subgroupWords.filter((item) => item.subgroup_id === subgroupId).map((item) => item.word_id);
        return words.filter((word) => ids.includes(word.id));
    };

    const getPersonalSubgroupWords = (subgroupId: number): TQuizletWord[] => {
        return personalWords.filter((word) => word.subgroup_id === subgroupId);
    };

    const selectedLesson =
        // Derive from URL for view section
        (() => {
            const id = viewLessonRouteId ?? viewTopicLessonRouteId;
            return id !== null ? groups.find((group) => group.id === id) ?? null : null;
        })();
    const selectedLessonTopics = selectedLesson
        ? subgroups.filter((subgroup) => subgroup.group_id === selectedLesson.id)
        : [];
    const selectedTopic =
        viewTopicRouteId !== null
            ? selectedLessonTopics.find((subgroup) => subgroup.id === viewTopicRouteId) ?? null
            : null;
    const selectedTopicWords = selectedTopic ? getSubgroupWords(selectedTopic.id) : [];
    const selectedPersonalSubgroup =
        selectedPersonalTopicId !== null
            ? personalSubgroups.find((subgroup) => subgroup.id === selectedPersonalTopicId) ?? null
            : null;

    const personalRootLabel =
        personalLesson !== null
            ? personalLesson.title
            : personalLessonTitle.trim().length > 0
            ? personalLessonTitle.trim()
            : "Мой словарь";

    const isDictionaryViewPage = session === null && isViewRoute;
    const isPersonalDictionaryPage = session === null && (isPersonalDictionaryRoute || isPersonalTopicRoute);
    const isPersonalTopicPage = session === null && isPersonalTopicRoute;
    const isTrainingSetupPage = session === null && isSetupRoute;
    const isProgressPage = session === null && isProgressRoute;
    const pageTitle = isDictionaryViewPage
        ? "先生の辞書"
        : isPersonalDictionaryPage
        ? personalRootLabel
        : isTrainingSetupPage
        ? "トレーニング"
        : isProgressPage
        ? "私の結果"
        : isFlashcardsRoute
        ? "フラッシュカード"
        : isResultsRoute
        ? "スコア"
        : isPairsRoute
        ? "ペア"
        : "ワードラボ";
    const pageBackUrl =
        (session === null && location.pathname === routePaths.view) || isTrainingSetupPage || isProgressPage
            ? routePaths.modeSelection
            : session === null && viewLessonRouteId !== null && viewTopicRouteId === null
            ? routePaths.view
            : session === null && viewTopicRouteId !== null
            ? getViewLessonPath(viewTopicLessonRouteId!)
            : isPersonalTopicPage
            ? routePaths.personalDictionary
            : isPersonalDictionaryPage
            ? routePaths.view
            : isFlashcardsRoute || isResultsRoute || isPairsRoute
            ? undefined
            : "/";

    const canInlineEditLessonTitle =
        isPersonalDictionaryPage && selectedPersonalTopicId === null && personalLesson !== null;

    const pageTitleElement = canInlineEditLessonTitle ? (
        isEditingLessonTitle ? (
            <input
                className="form-control form-control-sm quizlet-page-title-inline-edit-input"
                value={personalLessonTitle}
                onChange={(e) => setPersonalLessonTitle(e.target.value)}
                placeholder="Например: Мой словарь"
                autoFocus
                onBlur={ensurePersonalLesson}
                onKeyDown={(e) => {
                    if (e.key === "Enter") ensurePersonalLesson();
                    if (e.key === "Escape" && personalLesson !== null) {
                        setIsEditingLessonTitle(false);
                        setPersonalLessonTitle(personalLesson.title);
                    }
                }}
            />
        ) : (
            <span className="d-inline-flex align-items-center gap-2">
                <span>{personalRootLabel}</span>
                <button
                    className="btn btn-sm btn-link p-0 text-muted quizlet-personal-topic-edit-btn"
                    title="Переименовать"
                    onClick={() => {
                        setIsEditingLessonTitle(true);
                        setPersonalLessonTitle(personalLesson!.title);
                    }}
                >
                    <i className="bi bi-pencil" />
                </button>
            </span>
        )
    ) : undefined;

    return (
        <div className="container">
            <PageTitle title={pageTitle} titleElement={pageTitleElement} urlBack={pageBackUrl} />

            {session === null && isModeSelectionRoute && (
                <div
                    className="mx-auto mt-5"
                    style={{
                        maxWidth: "760px",
                    }}
                >
                    <div className="d-flex justify-content-center align-items-center flex-wrap gap-4">
                        <button
                            className="btn quizlet-mode-button quizlet-mode-button-view quizlet-mode-button-rect d-flex flex-column justify-content-center align-items-center"
                            style={{ width: "220px", height: "140px" }}
                            onClick={() => navigate(routePaths.view)}
                        >
                            <i className="bi bi-journal-text quizlet-mode-icon" />
                            <span className="quizlet-mode-label">Все словари</span>
                        </button>
                        <button
                            className="btn quizlet-mode-button quizlet-mode-button-training quizlet-mode-button-rect d-flex flex-column justify-content-center align-items-center"
                            style={{ width: "220px", height: "140px" }}
                            onClick={() => navigate(routePaths.setup)}
                        >
                            <i className="bi bi-lightning quizlet-mode-icon" />
                            <span className="quizlet-mode-label">Потренируемся?</span>
                        </button>
                        <button
                            className="btn quizlet-mode-button quizlet-mode-button-progress quizlet-mode-button-rect d-flex flex-column justify-content-center align-items-center"
                            style={{ width: "220px", height: "140px" }}
                            onClick={() => navigate(routePaths.progress)}
                        >
                            <i className="bi bi-bar-chart-line quizlet-mode-icon" />
                            <span className="quizlet-mode-label">Мои успехи</span>
                        </button>
                    </div>
                </div>
            )}

            {session === null && isSetupRoute && (
                <div className="mx-auto mt-5" style={{ maxWidth: "760px" }}>
                    {activeSessionLoadStatus === LoadStatus.DONE &&
                        activeSession !== null &&
                        !activeSession.is_finished && (
                            <div className="alert alert-warning d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2">
                                <div>
                                    <div className="fw-semibold mb-1">Есть незавершенная тренировка</div>
                                    <div className="small">
                                        Тип: {activeSession.quiz_type === "flashcards" ? "Карточки" : "Пары"} •
                                        Прогресс: {activeSession.correct_answers}/{activeSession.total_words}
                                    </div>
                                    <div className="small">
                                        Начало: {formatSessionStartDateTime(activeSession.started_at)}
                                    </div>
                                </div>
                                <div className="d-flex gap-2">
                                    <button type="button" className="btn btn-warning" onClick={continueSession}>
                                        Продолжить
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger"
                                        onClick={finishActiveSession}
                                        disabled={isFinishingActiveSession}
                                    >
                                        {isFinishingActiveSession ? "Завершение..." : "Завершить"}
                                    </button>
                                </div>
                            </div>
                        )}
                    <QuizletQuizStart
                        groups={groups}
                        subgroups={subgroups}
                        subgroupWords={subgroupWords}
                        words={words}
                        personalLesson={personalLesson}
                        personalSubgroups={personalSubgroups}
                        personalWords={personalWords}
                        onStart={startSession}
                    />
                </div>
            )}

            {session === null && isPersonalDictionaryPage && (
                <div className="quizlet-personal-dictionary-page" style={{ maxWidth: "760px", margin: "0 auto" }}>
                    <div className="quizlet-main-container">
                        {personalLesson !== null && (
                            <nav
                                aria-label="breadcrumb"
                                className="mb-3 quizlet-teacher-breadcrumb quizlet-student-view-breadcrumb"
                            >
                                <ol className="breadcrumb mb-0">
                                    <li
                                        className={`breadcrumb-item ${
                                            selectedPersonalSubgroup === null ? "active" : ""
                                        }`}
                                        {...(selectedPersonalSubgroup === null ? { "aria-current": "page" } : {})}
                                    >
                                        {selectedPersonalSubgroup === null ? (
                                            personalRootLabel
                                        ) : (
                                            <Link to={routePaths.personalDictionary}>{personalRootLabel}</Link>
                                        )}
                                    </li>
                                </ol>
                            </nav>
                        )}

                        {(personalLesson === null || selectedPersonalSubgroup !== null) && (
                            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                    {selectedPersonalTopicId === null && personalLesson === null ? (
                                        <div className="d-flex gap-2 flex-grow-1">
                                            <input
                                                className="form-control"
                                                value={personalLessonTitle}
                                                onChange={(e) => setPersonalLessonTitle(e.target.value)}
                                                placeholder="Например: Мой словарь"
                                                autoFocus
                                                onBlur={personalLesson !== null ? ensurePersonalLesson : undefined}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") ensurePersonalLesson();
                                                    if (e.key === "Escape") setPersonalLessonTitle("");
                                                }}
                                            />
                                            {personalLesson === null && (
                                                <button
                                                    className="btn btn-outline-primary"
                                                    onClick={ensurePersonalLesson}
                                                >
                                                    Создать
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="d-flex align-items-center gap-2 quizlet-student-topic-header-offset">
                                            {selectedPersonalSubgroup !== null && !isEditingPersonalTopicTitle && (
                                                <h5 className="quizlet-personal-topic-title mb-0">
                                                    {selectedPersonalSubgroup.title}
                                                </h5>
                                            )}

                                            {selectedPersonalSubgroup !== null && isEditingPersonalTopicTitle && (
                                                <input
                                                    className="quizlet-personal-topic-title-input"
                                                    value={personalTopicTitleDraft}
                                                    onChange={(e) => setPersonalTopicTitleDraft(e.target.value)}
                                                    autoFocus
                                                    onBlur={() =>
                                                        renamePersonalTopic(
                                                            selectedPersonalSubgroup,
                                                            personalTopicTitleDraft,
                                                        )
                                                    }
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            renamePersonalTopic(
                                                                selectedPersonalSubgroup,
                                                                personalTopicTitleDraft,
                                                            );
                                                        }
                                                        if (e.key === "Escape") {
                                                            setIsEditingPersonalTopicTitle(false);
                                                            setPersonalTopicTitleDraft(selectedPersonalSubgroup.title);
                                                        }
                                                    }}
                                                />
                                            )}

                                            {selectedPersonalSubgroup !== null && !isEditingPersonalTopicTitle && (
                                                <button
                                                    className="btn btn-sm btn-link p-0 text-muted quizlet-personal-topic-edit-btn"
                                                    title="Переименовать тему"
                                                    onClick={() => {
                                                        setIsEditingPersonalTopicTitle(true);
                                                        setPersonalTopicTitleDraft(selectedPersonalSubgroup.title);
                                                    }}
                                                >
                                                    <i className="bi bi-pencil" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="d-flex gap-2 align-items-center quizlet-personal-topic-header-actions">
                                    {selectedPersonalSubgroup !== null &&
                                        (isDeleteTopicConfirming ? (
                                            <>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={async () => {
                                                        setIsDeleteTopicConfirming(false);
                                                        await deletePersonalTopic(selectedPersonalSubgroup);
                                                        navigate(routePaths.personalDictionary);
                                                    }}
                                                >
                                                    Точно?
                                                </button>
                                                <button
                                                    className="btn btn-outline-secondary btn-sm"
                                                    onClick={() => setIsDeleteTopicConfirming(false)}
                                                >
                                                    Отмена
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                className="btn quizlet-personal-topic-delete-action-btn"
                                                onClick={() => setIsDeleteTopicConfirming(true)}
                                            >
                                                Удалить
                                            </button>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Topic list page */}
                        {personalLesson !== null && selectedPersonalTopicId === null && (
                            <>
                                <div className="mb-3 d-flex gap-2 align-items-center quizlet-personal-topic-create-row">
                                    <input
                                        className="form-control quizlet-personal-topic-create-input"
                                        value={newPersonalTopicTitle}
                                        onChange={(e) => setNewPersonalTopicTitle(e.target.value)}
                                        placeholder="Новая тема..."
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") addPersonalSubgroup();
                                        }}
                                    />
                                    <button
                                        className="btn btn-success btn-sm quizlet-personal-topic-create-btn"
                                        onClick={addPersonalSubgroup}
                                    >
                                        + Добавить
                                    </button>
                                </div>

                                {personalSubgroups.length === 0 && (
                                    <div className="text-muted">Тем пока нет. Добавьте первую тему.</div>
                                )}

                                {personalSubgroups.length > 0 && (
                                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-2 pt-1">
                                        {personalSubgroups.map((subgroup) => {
                                            const wordCount = personalWords.filter(
                                                (word) => word.subgroup_id === subgroup.id,
                                            ).length;

                                            return (
                                                <div className="col" key={subgroup.id}>
                                                    <button
                                                        className="btn w-100 text-start p-0 border-0 quizlet-topic-card-btn"
                                                        onClick={() => navigate(getPersonalTopicPath(subgroup.id))}
                                                    >
                                                        <div className="card quizlet-topic-card h-100">
                                                            <div className="card-body d-flex flex-column justify-content-between">
                                                                <span className="quizlet-topic-card__title">
                                                                    {subgroup.title}
                                                                </span>
                                                                <span className="quizlet-topic-card__count text-muted mt-2">
                                                                    <i className="bi bi-card-text me-1" />
                                                                    {wordCount} слов
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}

                        {personalLesson !== null && selectedPersonalSubgroup !== null && (
                            <PersonalTopicEditor
                                key={selectedPersonalSubgroup.id}
                                subgroup={selectedPersonalSubgroup}
                                initialWords={getPersonalSubgroupWords(selectedPersonalSubgroup.id)}
                                onSaved={fetchPersonal}
                            />
                        )}
                    </div>
                </div>
            )}

            {session === null && isViewRoute && (
                <div className="mx-auto mt-5" style={{ maxWidth: "760px" }}>
                    <div className="quizlet-main-container">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 px-1 pt-1 pb-2">
                            <nav
                                aria-label="breadcrumb"
                                className="mb-0 quizlet-teacher-breadcrumb quizlet-student-view-breadcrumb"
                            >
                                <ol className="breadcrumb mb-0">
                                    <li
                                        className={`breadcrumb-item ${selectedLesson === null ? "active" : ""}`}
                                        {...(selectedLesson === null ? { "aria-current": "page" } : {})}
                                    >
                                        {selectedLesson === null ? "Уроки" : <Link to={routePaths.view}>Уроки</Link>}
                                    </li>
                                    {selectedLesson !== null && (
                                        <li
                                            className={`breadcrumb-item ${selectedTopic === null ? "active" : ""}`}
                                            {...(selectedTopic === null ? { "aria-current": "page" } : {})}
                                        >
                                            {selectedTopic === null ? (
                                                selectedLesson.title
                                            ) : (
                                                <Link to={getViewLessonPath(selectedLesson.id)}>
                                                    {selectedLesson.title}
                                                </Link>
                                            )}
                                        </li>
                                    )}
                                    {selectedTopic !== null && (
                                        <li className="breadcrumb-item active" aria-current="page">
                                            {selectedTopic.title}
                                        </li>
                                    )}
                                </ol>
                            </nav>

                            <button
                                className="btn btn-success"
                                onClick={() => {
                                    if (personalLesson === null && personalLessonTitle.trim().length === 0) {
                                        setPersonalLessonTitle("Мой словарь");
                                    }
                                    navigate(routePaths.personalDictionary);
                                }}
                            >
                                {personalLesson === null ? "Create personal dictionary" : "Мой словарь"}
                            </button>
                        </div>

                        {groups.length === 0 && <div className="text-muted">Пока нет доступных уроков.</div>}

                        {groups.length > 0 && selectedLesson === null && (
                            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-2 pt-1">
                                {groups.map((group) => {
                                    const lessonTopics = subgroups.filter((subgroup) => subgroup.group_id === group.id);
                                    const lessonTopicIds = new Set(lessonTopics.map((subgroup) => subgroup.id));
                                    const lessonWordCount = subgroupWords.filter((sw) =>
                                        lessonTopicIds.has(sw.subgroup_id),
                                    ).length;

                                    return (
                                        <div className="col" key={group.id}>
                                            <button
                                                className="btn w-100 text-start p-0 border-0 quizlet-topic-card-btn"
                                                onClick={() => {
                                                    navigate(getViewLessonPath(group.id));
                                                }}
                                            >
                                                <div className="card quizlet-topic-card h-100">
                                                    <div className="card-body d-flex flex-column justify-content-between">
                                                        <span className="quizlet-topic-card__title fw-semibold">
                                                            {group.title}
                                                        </span>
                                                        <span className="quizlet-topic-card__count text-muted mt-2">
                                                            <i className="bi bi-collection me-1" />
                                                            {lessonTopics.length} тем
                                                            <span className="mx-2">•</span>
                                                            <i className="bi bi-card-text me-1" />
                                                            {lessonWordCount} слов
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {selectedLesson !== null && selectedTopic === null && (
                            <>
                                {selectedLessonTopics.length === 0 && (
                                    <div className="text-muted small">В этом уроке пока нет тем.</div>
                                )}
                                {selectedLessonTopics.length > 0 && (
                                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-2 pt-1">
                                        {selectedLessonTopics.map((subgroup) => {
                                            const wordCount = subgroupWords.filter(
                                                (sw) => sw.subgroup_id === subgroup.id,
                                            ).length;
                                            return (
                                                <div className="col" key={subgroup.id}>
                                                    <button
                                                        className="btn w-100 text-start p-0 border-0 quizlet-topic-card-btn"
                                                        onClick={() =>
                                                            navigate(getViewTopicPath(selectedLesson.id, subgroup.id))
                                                        }
                                                    >
                                                        <div className="card quizlet-topic-card h-100">
                                                            <div className="card-body d-flex flex-column justify-content-between">
                                                                <span className="quizlet-topic-card__title">
                                                                    {subgroup.title}
                                                                </span>
                                                                <span className="quizlet-topic-card__count text-muted mt-2">
                                                                    <i className="bi bi-card-text me-1" />
                                                                    {wordCount} слов
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}

                        {selectedLesson !== null && selectedTopic !== null && (
                            <>
                                <div className="table-responsive" style={{ maxWidth: "800px" }}>
                                    <table className="table table-bordered table-hover align-middle mb-0">
                                        <thead>
                                            <tr className="table-light">
                                                <th
                                                    className="quizlet-dictionary-table-head"
                                                    style={{ width: "28%", padding: "9px 14px" }}
                                                >
                                                    Кандзи
                                                </th>
                                                <th
                                                    className="quizlet-dictionary-table-head"
                                                    style={{ width: "28%", padding: "9px 14px" }}
                                                >
                                                    Чтение
                                                </th>
                                                <th
                                                    className="quizlet-dictionary-table-head"
                                                    style={{ width: "44%", padding: "9px 14px" }}
                                                >
                                                    Перевод
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedTopicWords.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={3}
                                                        className="text-muted small"
                                                        style={{ padding: "9px 14px" }}
                                                    >
                                                        Нет слов в этой теме.
                                                    </td>
                                                </tr>
                                            )}
                                            {selectedTopicWords.map((word) => (
                                                <tr key={word.id}>
                                                    <td style={{ padding: "9px 14px" }}>{word.char_jp ?? ""}</td>
                                                    <td style={{ padding: "9px 14px" }}>{word.word_jp}</td>
                                                    <td style={{ padding: "9px 14px" }}>{word.ru}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {session === null && isProgressRoute && (
                <div className="mx-auto mt-5" style={{ maxWidth: "760px" }}>
                    <QuizletProgressHistory
                        sessions={historySessions}
                        isLoading={historyLoadStatus === LoadStatus.LOADING}
                        hasError={historyLoadStatus === LoadStatus.ERROR}
                        expandedSessionId={expandedHistorySessionId}
                        loadingDetailsSessionId={historyLoadingDetailsSessionId}
                        sessionWordsById={historySessionWordsById}
                        onRowClick={toggleHistorySession}
                        onRetryLoad={loadHistory}
                        getTopicsFromSessionWords={getTopicsFromSessionWords}
                    />
                </div>
            )}

            {session !== null && (
                <div className="quizlet-session-shell p-3 p-md-4">
                    {!session.is_finished && session.quiz_type !== "flashcards" && session.quiz_type !== "pair" && (
                        <div className="mb-3">
                            <div className="training-session-header-shell">
                                <TrainingSessionHeader
                                    incorrectAnswers={session.incorrect_answers}
                                    elapsedSeconds={liveElapsedSeconds}
                                    currentPosition={session.correct_answers}
                                    totalWords={session.total_words}
                                    currentPage={matchingPageInfo.currentPage}
                                    totalPages={matchingPageInfo.totalPages}
                                    onFinishTraining={endNow}
                                />
                            </div>
                        </div>
                    )}

                    {!session.is_finished && session.quiz_type === "pair" && (
                        <div className="quizlet-main-container matching-session-wrapper">
                            <div className="matching-session-header">
                                <TrainingSessionHeader
                                    incorrectAnswers={session.incorrect_answers}
                                    elapsedSeconds={liveElapsedSeconds}
                                    currentPosition={session.correct_answers}
                                    totalWords={session.total_words}
                                    currentPage={matchingPageInfo.currentPage}
                                    totalPages={matchingPageInfo.totalPages}
                                    onFinishTraining={endNow}
                                />
                            </div>
                            <MatchingExercise
                                words={sessionWords}
                                showHints={session.show_hints}
                                onAttempt={submitPairAttempt}
                                onPageChange={(page, total) =>
                                    setMatchingPageInfo({ currentPage: page, totalPages: total })
                                }
                            />
                        </div>
                    )}

                    {!session.is_finished && session.quiz_type === "flashcards" && (
                        <FlashcardExercise
                            words={sessionWords}
                            queue={queue}
                            showHints={session.show_hints}
                            direction={session.translation_direction}
                            totalWords={session.total_words}
                            unresolvedCount={unresolvedCount}
                            incorrectAnswers={session.incorrect_answers}
                            elapsedSeconds={liveElapsedSeconds}
                            onFinishTraining={endNow}
                            onWordVisible={markFlashcardVisible}
                            onAnswer={submitFlashcard}
                        />
                    )}

                    {session.is_finished && (
                        <QuizletSessionResults
                            correct={session.correct_answers}
                            incorrect={session.incorrect_answers}
                            skipped={session.skipped_words}
                            totalWords={session.total_words}
                            elapsedSeconds={session.elapsed_seconds}
                            onRetryAll={retryAll}
                            onRetryIncorrect={retryIncorrect}
                            onFinish={finishAndBackToStart}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentQuizlet;
