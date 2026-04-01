import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

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
import QuizletQuizStart from "./QuizletQuizStart";
import QuizletSessionResults from "./QuizletSessionResults";
import { formatDuration, parseQueue } from "./quizletUtils";

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

interface PersonalTopicEditorProps {
    subgroup: TQuizletSubgroup;
    initialWords: TQuizletWord[];
    onRename: () => void;
    onDelete: () => void;
    onSaved: () => void;
}

const PersonalTopicEditor = ({ subgroup, initialWords, onRename, onDelete, onSaved }: PersonalTopicEditorProps) => {
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
        <div className="border rounded p-2 mb-2">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>{subgroup.title}</strong>
                <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-secondary" onClick={onRename}>
                        Переименовать
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>
                        Удалить
                    </button>
                </div>
            </div>

            <div className="table-responsive">
                <table ref={tableRef} className="table table-sm table-bordered align-middle mb-1" onPaste={handlePaste}>
                    <thead>
                        <tr className="table-light">
                            <th style={{ width: "28%" }}>Кандзи</th>
                            <th style={{ width: "28%" }}>Кана</th>
                            <th style={{ width: "37%" }}>Перевод</th>
                            <th style={{ width: "7%" }}></th>
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
                                                className="form-control form-control-sm border-0 rounded-0 shadow-none"
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
                                            className="btn btn-sm btn-link text-danger p-1 lh-1"
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
                    <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={isSaving || !isDirty}>
                        {isSaving ? "Сохранение..." : "Сохранить тему"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const StudentQuizlet = () => {
    const [loadStatus, setLoadStatus] = useState<LoadStatus.Type>(LoadStatus.NONE);
    const [mode, setMode] = useState<"training" | "view" | null>(null);

    const [groups, setGroups] = useState<TQuizletGroup[]>([]);
    const [subgroups, setSubgroups] = useState<TQuizletSubgroup[]>([]);
    const [subgroupWords, setSubgroupWords] = useState<TQuizletSubgroupWord[]>([]);
    const [words, setWords] = useState<TQuizletWord[]>([]);

    const [personalLesson, setPersonalLesson] = useState<TQuizletLesson | null>(null);
    const [personalSubgroups, setPersonalSubgroups] = useState<TQuizletSubgroup[]>([]);
    const [personalWords, setPersonalWords] = useState<TQuizletWord[]>([]);

    const [session, setSession] = useState<(TQuizletSession & { queue_state?: string }) | null>(null);
    const [sessionWords, setSessionWords] = useState<TQuizletSessionWord[]>([]);

    const [isEditingPersonal, setIsEditingPersonal] = useState(false);
    const [personalLessonTitle, setPersonalLessonTitle] = useState<string>("");
    const [newPersonalTopicTitle, setNewPersonalTopicTitle] = useState<string>("");

    const [lastStartPayload, setLastStartPayload] = useState<any>(null);

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

    useEffect(() => {
        loadData();
    }, []);

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
        return parseQueue(session as any);
    }, [session]);

    const startSession = (payload: any) => {
        setLastStartPayload(payload);
        AjaxPost<{ session: TQuizletSession }>({ url: "/api/quizlet/sessions/start", body: payload }).then((json) => {
            loadSession(json.session.id);
        });
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
        }).then((json) => loadSession(json.session.id));
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

        await AjaxPost({
            url: `/api/quizlet/sessions/${session.id}/flashcard-answer`,
            body: {
                session_word_id: wordId,
                recognized,
            },
        });
        loadSession(session.id);
    };

    const ensurePersonalLesson = () => {
        if (personalLessonTitle.trim().length === 0) {
            return;
        }

        const endpoint = "/api/quizlet/personal";
        const method = personalLesson === null ? AjaxPost : AjaxPatch;

        method({ url: endpoint, body: { title: personalLessonTitle } }).then(() => {
            fetchPersonal();
        });
    };

    const addPersonalSubgroup = () => {
        if (newPersonalTopicTitle.trim().length === 0) {
            return;
        }

        AjaxPost({ url: "/api/quizlet/personal/subgroups", body: { title: newPersonalTopicTitle } }).then(() => {
            setNewPersonalTopicTitle("");
            fetchPersonal();
        });
    };

    const renamePersonalTopic = async (subgroup: TQuizletSubgroup) => {
        const title = window.prompt("Новое название темы", subgroup.title);
        if (!title || title.trim().length === 0) return;
        await AjaxPatch({ url: `/api/quizlet/personal/subgroups/${subgroup.id}`, body: { title } });
        fetchPersonal();
    };

    const deletePersonalTopic = async (subgroup: TQuizletSubgroup) => {
        await AjaxDelete({ url: `/api/quizlet/personal/subgroups/${subgroup.id}` });
        fetchPersonal();
    };

    const finishAndBackToStart = () => {
        setSession(null);
        setSessionWords([]);
    };

    useEffect(() => {
        if (personalLesson !== null && personalLessonTitle.trim().length === 0) {
            setPersonalLessonTitle(personalLesson.title);
        }
    }, [personalLesson]);

    useEffect(() => {
        if (session === null || session.is_finished) {
            return;
        }

        const intervalId = setInterval(() => {
            const sessionQueue = parseQueue(session as any);
            AjaxPost({
                url: `/api/quizlet/sessions/${session.id}/save-progress`,
                body: { queue: sessionQueue },
            }).catch(() => undefined);
        }, 10000);

        return () => clearInterval(intervalId);
    }, [session]);

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

    const unresolvedCount = sessionWords.filter((word) => !word.is_correct).length;

    const getSubgroupWords = (subgroupId: number): TQuizletWord[] => {
        const ids = subgroupWords.filter((item) => item.subgroup_id === subgroupId).map((item) => item.word_id);
        return words.filter((word) => ids.includes(word.id));
    };

    const getPersonalSubgroupWords = (subgroupId: number): TQuizletWord[] => {
        return personalWords.filter((word) => word.subgroup_id === subgroupId);
    };

    return (
        <div className="container">
            <PageTitle title="Quizlet" />

            {session === null && mode === null && (
                <div
                    className="card p-3 p-md-4 mx-auto"
                    style={{
                        maxWidth: "760px",
                        background: "linear-gradient(180deg, #fbfdff 0%, #f6e9f4a5 100%)",
                        borderColor: "#e9eff5",
                    }}
                >
                    <h4 className="text-center mb-4">Выберите режим</h4>
                    <div className="d-flex justify-content-center align-items-center flex-wrap gap-4">
                        <button
                            className="btn btn-outline-primary rounded-circle d-flex flex-column justify-content-center align-items-center"
                            style={{ width: "180px", height: "180px" }}
                            onClick={() => setMode("training")}
                        >
                            <i className="bi bi-lightning-charge fs-2 mb-2" />
                            <span className="fw-semibold">Training mode</span>
                        </button>
                        <button
                            className="btn btn-outline-secondary rounded-circle d-flex flex-column justify-content-center align-items-center"
                            style={{ width: "180px", height: "180px" }}
                            onClick={() => setMode("view")}
                        >
                            <i className="bi bi-book fs-2 mb-2" />
                            <span className="fw-semibold">View mode</span>
                        </button>
                    </div>
                </div>
            )}

            {session === null && mode === "training" && (
                <>
                    <div className="mb-3">
                        <button className="btn btn-outline-secondary" onClick={() => setMode(null)}>
                            Назад к выбору режима
                        </button>
                    </div>

                    <QuizletQuizStart
                        groups={groups}
                        subgroups={subgroups}
                        personalLesson={personalLesson}
                        personalSubgroups={personalSubgroups}
                        onStart={startSession}
                    />
                </>
            )}

            {session === null && mode === "view" && (
                <>
                    <div className="mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <button className="btn btn-outline-secondary" onClick={() => setMode(null)}>
                            Назад к выбору режима
                        </button>

                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                setIsEditingPersonal((prev) => !prev);
                                if (personalLesson === null && personalLessonTitle.trim().length === 0) {
                                    setPersonalLessonTitle("Мой словарь");
                                }
                            }}
                        >
                            {personalLesson === null ? "Create personal dictionary" : "Edit personal dictionary"}
                        </button>
                    </div>

                    {isEditingPersonal && (
                        <div className="card p-3 p-md-4 mb-3">
                            <h4 className="mb-3">Личный словарь</h4>

                            <div className="mb-3">
                                <label className="form-label">Название словаря</label>
                                <div className="d-flex gap-2">
                                    <input
                                        className="form-control"
                                        value={personalLessonTitle}
                                        onChange={(e) => setPersonalLessonTitle(e.target.value)}
                                        placeholder="Например: Мой словарь"
                                    />
                                    <button className="btn btn-outline-primary" onClick={ensurePersonalLesson}>
                                        {personalLesson === null ? "Создать" : "Сохранить"}
                                    </button>
                                </div>
                            </div>

                            {personalLesson !== null && (
                                <>
                                    <div className="mb-3">
                                        <label className="form-label">Новая тема</label>
                                        <div className="d-flex gap-2">
                                            <input
                                                className="form-control"
                                                value={newPersonalTopicTitle}
                                                onChange={(e) => setNewPersonalTopicTitle(e.target.value)}
                                                placeholder="Название темы"
                                            />
                                            <button className="btn btn-outline-primary" onClick={addPersonalSubgroup}>
                                                Добавить тему
                                            </button>
                                        </div>
                                    </div>

                                    {personalSubgroups.length === 0 && (
                                        <div className="text-muted">Тем пока нет. Добавьте первую тему.</div>
                                    )}

                                    {personalSubgroups.map((subgroup) => (
                                        <PersonalTopicEditor
                                            key={subgroup.id}
                                            subgroup={subgroup}
                                            initialWords={getPersonalSubgroupWords(subgroup.id)}
                                            onRename={() => renamePersonalTopic(subgroup)}
                                            onDelete={() => deletePersonalTopic(subgroup)}
                                            onSaved={fetchPersonal}
                                        />
                                    ))}
                                </>
                            )}
                        </div>
                    )}

                    <div className="card p-3 p-md-4">
                        <h4 className="mb-3">Словари преподавателя</h4>

                        {groups.length === 0 && <div className="text-muted">Пока нет доступных уроков.</div>}

                        {groups.map((group) => {
                            const nestedSubgroups = subgroups.filter((subgroup) => subgroup.group_id === group.id);

                            return (
                                <div key={group.id} className="border rounded p-3 mb-3">
                                    <h5 className="mb-3">{group.title}</h5>

                                    {nestedSubgroups.length === 0 && (
                                        <div className="text-muted small">В этом уроке пока нет тем.</div>
                                    )}

                                    {nestedSubgroups.map((subgroup) => {
                                        const subgroupWordsList = getSubgroupWords(subgroup.id);

                                        return (
                                            <div key={subgroup.id} className="mb-3">
                                                <h6 className="mb-2">{subgroup.title}</h6>
                                                <div className="table-responsive">
                                                    <table className="table table-sm table-bordered align-middle mb-0">
                                                        <thead>
                                                            <tr className="table-light">
                                                                <th style={{ width: "28%" }}>char_jp</th>
                                                                <th style={{ width: "28%" }}>word_jp</th>
                                                                <th style={{ width: "44%" }}>ru</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {subgroupWordsList.length === 0 && (
                                                                <tr>
                                                                    <td colSpan={3} className="text-muted small">
                                                                        Нет слов в этой теме.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                            {subgroupWordsList.map((word) => (
                                                                <tr key={word.id}>
                                                                    <td>{word.char_jp ?? ""}</td>
                                                                    <td>{word.word_jp}</td>
                                                                    <td>{word.ru}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {session !== null && (
                <div className="card p-3 p-md-4">
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        <strong>
                            Прогресс: {session.correct_answers}/{session.total_words} | Ошибок:{" "}
                            {session.incorrect_answers} | Осталось: {unresolvedCount} | Время:{" "}
                            {formatDuration(session.elapsed_seconds)}
                        </strong>
                        {!session.is_finished && (
                            <button className="btn btn-outline-danger" onClick={endNow}>
                                Закончить тренировку
                            </button>
                        )}
                    </div>

                    {!session.is_finished && session.quiz_type === "pair" && (
                        <MatchingExercise
                            words={sessionWords}
                            showHints={session.show_hints}
                            onAttempt={submitPairAttempt}
                        />
                    )}

                    {!session.is_finished && session.quiz_type === "flashcards" && (
                        <FlashcardExercise
                            words={sessionWords}
                            queue={queue}
                            showHints={session.show_hints}
                            direction={session.translation_direction}
                            onAnswer={submitFlashcard}
                        />
                    )}

                    {!session.is_finished && unresolvedCount === 0 && (
                        <div className="mt-3">
                            <button
                                className="btn btn-success"
                                onClick={() => {
                                    AjaxPost<{ session: TQuizletSession }>({
                                        url: `/api/quizlet/sessions/${session.id}/end`,
                                        body: { force_finish: false },
                                    }).then(() => loadSession(session.id));
                                }}
                            >
                                Завершить и показать результат
                            </button>
                        </div>
                    )}

                    {session.is_finished && (
                        <QuizletSessionResults
                            correct={session.correct_answers}
                            incorrect={session.incorrect_answers}
                            skipped={session.skipped_words}
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
