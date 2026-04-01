import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import Loading from "components/Common/Loading";
import PageTitle from "components/Common/PageTitle";
import ErrorPage from "components/ErrorPages/ErrorPage";
import { AjaxDelete, AjaxGet, AjaxPatch, AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { TQuizletGroup, TQuizletSubgroup, TQuizletSubgroupWord, TQuizletWord } from "models/TQuizlet";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CatalogResponse {
    groups: TQuizletGroup[];
    subgroups: TQuizletSubgroup[];
    subgroup_words: TQuizletSubgroupWord[];
    words: TQuizletWord[];
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _keyCounter = 0;
const makeKey = () => `row_${++_keyCounter}`;
const makeEmptyRow = (): EditorRow => ({ key: makeKey(), char_jp: "", word_jp: "", ru: "" });

const wordsToRows = (words: TQuizletWord[]): EditorRow[] =>
    words.map((w) => ({ key: makeKey(), id: w.id, char_jp: w.char_jp ?? "", word_jp: w.word_jp, ru: w.ru }));

const isAllEmpty = (row: EditorRow) => row.char_jp.trim() === "" && row.word_jp.trim() === "" && row.ru.trim() === "";

const isJpEmpty = (row: EditorRow) => row.char_jp.trim() === "" && row.word_jp.trim() === "";

// ─── TopicEditor ──────────────────────────────────────────────────────────────

interface TopicEditorProps {
    subgroup: TQuizletSubgroup;
    initialWords: TQuizletWord[];
    onRename: () => void;
    onDelete: () => void;
}

const TopicEditor = ({ subgroup, initialWords, onRename, onDelete }: TopicEditorProps) => {
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

    // Apply pending focus synchronously after DOM update
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

    // ── Validation ────────────────────────────────────────────────────────────

    const rowFlags = useMemo(() => {
        const flags = new Map<string, { danger: boolean; warning: boolean }>();
        const charSeen = new Map<string, string>(); // trimmed value → first row key
        const kanaSeen = new Map<string, string>();

        for (const row of rows) {
            let danger = false;
            let warning = false;

            if (!isAllEmpty(row) && isJpEmpty(row)) {
                danger = true; // translation present but no Japanese text
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

    // ── Dirty check ───────────────────────────────────────────────────────────

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

    // ── Cell / row editing ────────────────────────────────────────────────────

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

    // ── Keyboard navigation ───────────────────────────────────────────────────

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

    // ── Paste from Excel ──────────────────────────────────────────────────────

    const handlePaste = (e: React.ClipboardEvent<HTMLTableElement>) => {
        const text = e.clipboardData.getData("text");
        if (!text.includes("\t") && !text.includes("\n")) return; // single-cell paste — let it through
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

    // ── Save ──────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(null);
        try {
            // 1. Delete removed words from subgroup
            for (const id of deletedIds) {
                await AjaxDelete({ url: `/api/quizlet/subgroups/${subgroup.id}/words/${id}` });
            }

            const nonEmpty = rows.filter((r) => !isAllEmpty(r));
            const toCreate = nonEmpty.filter((r) => r.id === undefined);
            const toUpdate = nonEmpty.filter((r) => {
                if (r.id === undefined) return false;
                const orig = committedWords.get(r.id);
                if (!orig) return false;
                return (orig.char_jp ?? "") !== r.char_jp || orig.word_jp !== r.word_jp || orig.ru !== r.ru;
            });

            // 2. Batch-create new words
            let created: TQuizletWord[] = [];
            if (toCreate.length > 0) {
                const resp = await AjaxPost<{ words: TQuizletWord[] }>({
                    url: "/api/quizlet/words/batch",
                    body: {
                        words: toCreate.map((r) => ({
                            subgroup_id: subgroup.id,
                            char_jp: r.char_jp.trim() || null,
                            word_jp: r.word_jp,
                            ru: r.ru,
                        })),
                    },
                });
                created = resp.words;
            }

            // 3. Update changed words
            for (const row of toUpdate) {
                await AjaxPatch({
                    url: `/api/quizlet/words/${row.id}`,
                    body: { char_jp: row.char_jp.trim() || null, word_jp: row.word_jp, ru: row.ru },
                });
            }

            // 4. Assign server IDs to newly created rows
            let createIdx = 0;
            const updatedRows = rows.map((row) => {
                if (!isAllEmpty(row) && row.id === undefined && createIdx < created.length) {
                    return { ...row, id: created[createIdx++].id };
                }
                return row;
            });
            setRows(updatedRows);
            setDeletedIds([]);

            // 5. Refresh committed snapshot
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
        } catch {
            setSaveError("Ошибка при сохранении");
        } finally {
            setIsSaving(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

const TeacherQuizletManager = () => {
    const [loadStatus, setLoadStatus] = useState<LoadStatus.Type>(LoadStatus.NONE);
    const [groups, setGroups] = useState<TQuizletGroup[]>([]);
    const [subgroups, setSubgroups] = useState<TQuizletSubgroup[]>([]);
    const [subgroupWords, setSubgroupWords] = useState<TQuizletSubgroupWord[]>([]);
    const [words, setWords] = useState<TQuizletWord[]>([]);

    const [newGroupTitle, setNewGroupTitle] = useState("");
    const [newSubgroup, setNewSubgroup] = useState<{ groupId: number; title: string }>({ groupId: 0, title: "" });

    const fetchCatalog = () => {
        setLoadStatus(LoadStatus.LOADING);
        AjaxGet<CatalogResponse>({ url: "/api/quizlet/groups" })
            .then((json) => {
                setGroups(json.groups);
                setSubgroups(json.subgroups);
                setSubgroupWords(json.subgroup_words);
                setWords(json.words);
                setLoadStatus(LoadStatus.DONE);
            })
            .catch(() => setLoadStatus(LoadStatus.ERROR));
    };

    useEffect(() => {
        fetchCatalog();
    }, []);

    const groupedSubgroups = useMemo(
        () => groups.map((group) => ({ group, subgroups: subgroups.filter((s) => s.group_id === group.id) })),
        [groups, subgroups],
    );

    const getSubgroupWords = (subgroupId: number): TQuizletWord[] => {
        const ids = subgroupWords.filter((item) => item.subgroup_id === subgroupId).map((item) => item.word_id);
        return words.filter((word) => ids.includes(word.id));
    };

    if (loadStatus === LoadStatus.ERROR) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Не удалось загрузить Quizlet manager"
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (loadStatus !== LoadStatus.DONE) {
        return <Loading />;
    }

    return (
        <div className="container">
            <PageTitle title="Quizlet manager" />

            {/* New lesson (group) */}
            <div className="card p-3 p-md-4 mb-3">
                <h5 className="mb-3">Новый урок</h5>
                <div className="d-flex gap-2">
                    <input
                        className="form-control"
                        value={newGroupTitle}
                        onChange={(e) => setNewGroupTitle(e.target.value)}
                        placeholder="Название урока"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && newGroupTitle.trim().length > 0) {
                                AjaxPost({ url: "/api/quizlet/groups", body: { title: newGroupTitle } }).then(() => {
                                    setNewGroupTitle("");
                                    fetchCatalog();
                                });
                            }
                        }}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            if (newGroupTitle.trim().length === 0) return;
                            AjaxPost({ url: "/api/quizlet/groups", body: { title: newGroupTitle } }).then(() => {
                                setNewGroupTitle("");
                                fetchCatalog();
                            });
                        }}
                    >
                        Добавить
                    </button>
                </div>
            </div>

            {/* New topic (subgroup) */}
            <div className="card p-3 p-md-4 mb-3">
                <h5 className="mb-3">Новая тема</h5>
                <div className="row g-2">
                    <div className="col-12 col-md-4">
                        <select
                            className="form-select"
                            value={newSubgroup.groupId}
                            onChange={(e) => setNewSubgroup({ ...newSubgroup, groupId: Number(e.target.value) })}
                        >
                            <option value={0}>Выберите урок</option>
                            {groups.map((group) => (
                                <option key={group.id} value={group.id}>
                                    {group.title}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-12 col-md-6">
                        <input
                            className="form-control"
                            value={newSubgroup.title}
                            onChange={(e) => setNewSubgroup({ ...newSubgroup, title: e.target.value })}
                            placeholder="Название темы"
                        />
                    </div>
                    <div className="col-12 col-md-2 d-grid">
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                if (newSubgroup.groupId <= 0 || newSubgroup.title.trim().length === 0) return;
                                AjaxPost({
                                    url: `/api/quizlet/groups/${newSubgroup.groupId}/subgroups`,
                                    body: { title: newSubgroup.title },
                                }).then(() => {
                                    setNewSubgroup({ groupId: 0, title: "" });
                                    fetchCatalog();
                                });
                            }}
                        >
                            Добавить
                        </button>
                    </div>
                </div>
            </div>

            {/* Lessons with topic editors */}
            {groupedSubgroups.map(({ group, subgroups: groupSubgroups }) => (
                <div key={group.id} className="card p-3 p-md-4 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">{group.title}</h5>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => {
                                    const title = window.prompt("Новое название урока", group.title);
                                    if (!title || title.trim().length === 0) return;
                                    AjaxPatch({ url: `/api/quizlet/groups/${group.id}`, body: { title } }).then(() =>
                                        fetchCatalog(),
                                    );
                                }}
                            >
                                Переименовать
                            </button>
                            <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() =>
                                    AjaxDelete({ url: `/api/quizlet/groups/${group.id}` }).then(() => fetchCatalog())
                                }
                            >
                                Удалить
                            </button>
                        </div>
                    </div>

                    {groupSubgroups.length === 0 && (
                        <p className="text-muted small mb-0">Нет тем. Добавьте тему через форму выше.</p>
                    )}

                    {groupSubgroups.map((subgroup) => (
                        <TopicEditor
                            key={subgroup.id}
                            subgroup={subgroup}
                            initialWords={getSubgroupWords(subgroup.id)}
                            onRename={() => {
                                const title = window.prompt("Новое название темы", subgroup.title);
                                if (!title || title.trim().length === 0) return;
                                AjaxPatch({ url: `/api/quizlet/subgroups/${subgroup.id}`, body: { title } }).then(() =>
                                    fetchCatalog(),
                                );
                            }}
                            onDelete={() =>
                                AjaxDelete({ url: `/api/quizlet/subgroups/${subgroup.id}` }).then(() => fetchCatalog())
                            }
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default TeacherQuizletManager;
