import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Loading from "components/Common/Loading";
import ErrorPage from "components/ErrorPages/ErrorPage";
import { AjaxDelete, AjaxGet, AjaxPatch, AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { TQuizletGroup, TQuizletSubgroup, TQuizletSubgroupWord, TQuizletWord } from "models/TQuizlet";

import "./QuizletShared.css";

interface CatalogResponse {
    groups: TQuizletGroup[];
    subgroups: TQuizletSubgroup[];
    subgroup_words: TQuizletSubgroupWord[];
    words: TQuizletWord[];
}

interface GroupCreateResponse {
    group: TQuizletGroup;
}

interface SubgroupCreateResponse {
    subgroup: TQuizletSubgroup;
}

interface EditorRow {
    key: string;
    id?: number;
    char_jp: string;
    word_jp: string;
    ru: string;
}

interface SortableItem {
    id: number;
    title: string;
    sort: number;
}

type CommittedWords = Map<number, { char_jp: string | null; word_jp: string; ru: string }>;

const COLS = ["char_jp", "word_jp", "ru"] as const;
type ColField = (typeof COLS)[number];

let _keyCounter = 0;
const makeKey = () => `row_${++_keyCounter}`;
const makeEmptyRow = (): EditorRow => ({ key: makeKey(), char_jp: "", word_jp: "", ru: "" });
const QUIZLET_SORT_STEP = 10;

const wordsToRows = (words: TQuizletWord[]): EditorRow[] =>
    words.map((w) => ({ key: makeKey(), id: w.id, char_jp: w.char_jp ?? "", word_jp: w.word_jp, ru: w.ru }));

const isAllEmpty = (row: EditorRow) => row.char_jp.trim() === "" && row.word_jp.trim() === "" && row.ru.trim() === "";

const isJpEmpty = (row: EditorRow) => row.char_jp.trim() === "" && row.word_jp.trim() === "";

const getNextSort = (items: Pick<SortableItem, "sort">[]) => {
    if (items.length === 0) {
        return QUIZLET_SORT_STEP;
    }

    return Math.max(...items.map((item) => item.sort)) + QUIZLET_SORT_STEP;
};

const moveItem = <T extends { id: number }>(items: T[], itemId: number, direction: -1 | 1): T[] => {
    const currentIndex = items.findIndex((item) => item.id === itemId);
    const targetIndex = currentIndex + direction;

    if (currentIndex === -1 || targetIndex < 0 || targetIndex >= items.length) {
        return items;
    }

    const nextItems = [...items];
    const [item] = nextItems.splice(currentIndex, 1);
    nextItems.splice(targetIndex, 0, item);
    return nextItems;
};

interface TopicEditorProps {
    subgroup: TQuizletSubgroup;
    initialWords: TQuizletWord[];
    onDelete: () => void;
    onSaved: () => void;
}

const TopicEditor = ({ subgroup, initialWords, onDelete, onSaved }: TopicEditorProps) => {
    const [rows, setRows] = useState<EditorRow[]>(() =>
        initialWords.length > 0 ? wordsToRows(initialWords) : [makeEmptyRow()],
    );
    const [deletedIds, setDeletedIds] = useState<number[]>([]);
    const [committedWords, setCommittedWords] = useState<CommittedWords>(
        () => new Map(initialWords.map((w) => [w.id, { char_jp: w.char_jp, word_jp: w.word_jp, ru: w.ru }])),
    );
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

    const tableRef = useRef<HTMLTableElement>(null);
    const focusPending = useRef<{ rowIndex: number; col: number } | null>(null);

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

    useEffect(() => {
        if (!isDeleteConfirming) return;

        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest(".quizlet-editor-delete-confirm-wrap")) return;
            setIsDeleteConfirming(false);
        };

        document.addEventListener("click", handleOutsideClick);
        return () => document.removeEventListener("click", handleOutsideClick);
    }, [isDeleteConfirming]);

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

            for (const row of toUpdate) {
                await AjaxPatch({
                    url: `/api/quizlet/words/${row.id}`,
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
                                Кана
                            </th>
                            <th className="quizlet-dictionary-table-head" style={{ width: "37%" }}>
                                Перевод
                            </th>
                            <th style={{ width: "11%" }}>
                                <div className="d-flex align-items-center justify-content-center gap-2 quizlet-editor-delete-confirm-wrap">
                                    {isDeleteConfirming ? (
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => {
                                                setIsDeleteConfirming(false);
                                                onDelete();
                                            }}
                                        >
                                            Точно?
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-sm btn-link p-0 text-danger quizlet-personal-topic-row-delete-btn"
                                            title="Удалить"
                                            onClick={() => setIsDeleteConfirming(true)}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            </th>
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

interface QuizletBreadcrumbsProps {
    group?: TQuizletGroup;
    subgroup?: TQuizletSubgroup;
}

const QuizletBreadcrumbs = ({ group, subgroup }: QuizletBreadcrumbsProps) => {
    return (
        <nav aria-label="breadcrumb" className="mb-3 quizlet-personal-breadcrumb quizlet-teacher-breadcrumb">
            <ol className="breadcrumb mb-0">
                <li
                    className={`breadcrumb-item ${!group ? "active" : ""}`}
                    {...(!group ? { "aria-current": "page" } : {})}
                >
                    {!group ? "Lessons" : <Link to="/quizlet">Lessons</Link>}
                </li>
                {group && (
                    <li
                        className={`breadcrumb-item ${!subgroup ? "active" : ""}`}
                        {...(!subgroup ? { "aria-current": "page" } : {})}
                    >
                        {!subgroup ? group.title : <Link to={`/quizlet/lessons/${group.id}`}>{group.title}</Link>}
                    </li>
                )}
                {subgroup && (
                    <li className="breadcrumb-item active" aria-current="page">
                        {subgroup.title}
                    </li>
                )}
            </ol>
        </nav>
    );
};

interface OrderControlsProps {
    index: number;
    total: number;
    onMoveUp: () => void;
    onMoveDown: () => void;
}

const OrderControls = ({ index, total, onMoveUp, onMoveDown }: OrderControlsProps) => {
    return (
        <div className="d-flex flex-column align-items-center justify-content-center gap-1 flex-shrink-0">
            <button
                type="button"
                className="btn btn-sm btn-link p-0 text-muted"
                title="Поднять выше"
                onClick={onMoveUp}
                disabled={index === 0}
            >
                <i className="bi bi-arrow-up" />
            </button>
            <button
                type="button"
                className="btn btn-sm btn-link p-0 text-muted"
                title="Опустить ниже"
                onClick={onMoveDown}
                disabled={index === total - 1}
            >
                <i className="bi bi-arrow-down" />
            </button>
        </div>
    );
};

interface LessonsPageProps {
    groups: TQuizletGroup[];
    subgroups: TQuizletSubgroup[];
    subgroupWords: TQuizletSubgroupWord[];
    onCreateLesson: (title: string) => Promise<void>;
    onRenameLesson: (group: TQuizletGroup, title: string) => Promise<void>;
    onMoveLesson: (groupId: number, direction: -1 | 1) => Promise<void>;
    onDeleteLesson: (group: TQuizletGroup) => Promise<void>;
}

const LessonsPage = ({
    groups,
    subgroups,
    subgroupWords,
    onCreateLesson,
    onRenameLesson,
    onMoveLesson,
    onDeleteLesson,
}: LessonsPageProps) => {
    const [newLessonTitle, setNewLessonTitle] = useState("");
    const [confirmDeleteLessonId, setConfirmDeleteLessonId] = useState<number | null>(null);
    const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
    const [lessonTitleDraft, setLessonTitleDraft] = useState("");

    const handleCreate = async () => {
        const title = newLessonTitle.trim();
        if (title.length === 0) return;
        await onCreateLesson(title);
        setNewLessonTitle("");
    };

    const commitLessonRename = async (group: TQuizletGroup) => {
        const nextTitle = lessonTitleDraft.trim();
        if (nextTitle.length === 0 || nextTitle === group.title) {
            setLessonTitleDraft(group.title);
            setEditingLessonId(null);
            return;
        }
        await onRenameLesson(group, nextTitle);
        setEditingLessonId(null);
    };

    useEffect(() => {
        if (confirmDeleteLessonId === null) return;

        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest(".quizlet-lesson-delete-confirm-wrap")) return;
            setConfirmDeleteLessonId(null);
        };

        document.addEventListener("click", handleOutsideClick);
        return () => document.removeEventListener("click", handleOutsideClick);
    }, [confirmDeleteLessonId]);

    return (
        <>
            <QuizletBreadcrumbs />

            <div className="quizlet-main-container">
                <div
                    className="mb-3 d-flex gap-2 align-items-center quizlet-personal-topic-create-row"
                    style={{ width: "min(100%, 360px)" }}
                >
                    <input
                        className="form-control quizlet-personal-topic-create-input"
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                        placeholder="Lesson title"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleCreate();
                            }
                        }}
                    />
                    <button className="btn btn-success btn-sm quizlet-personal-topic-create-btn" onClick={handleCreate}>
                        +
                    </button>
                </div>

                {groups.length === 0 && (
                    <p className="text-muted small mb-0">No lessons yet. Create the first lesson.</p>
                )}

                {groups.length > 0 && (
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-2 pt-1">
                        {groups.map((group, index) => {
                            const lessonTopics = subgroups.filter((subgroup) => subgroup.group_id === group.id);
                            const lessonTopicIds = new Set(lessonTopics.map((subgroup) => subgroup.id));
                            const lessonWordCount = subgroupWords.filter((sw) =>
                                lessonTopicIds.has(sw.subgroup_id),
                            ).length;

                            return (
                                <div className="col" key={group.id}>
                                    <div className="quizlet-topic-card-btn h-100">
                                        <div className="card quizlet-topic-card h-100">
                                            <div className="card-body d-flex flex-column">
                                                <div className="quizlet-topic-card__header">
                                                    <OrderControls
                                                        index={index}
                                                        total={groups.length}
                                                        onMoveUp={() => onMoveLesson(group.id, -1)}
                                                        onMoveDown={() => onMoveLesson(group.id, 1)}
                                                    />
                                                    <div className="quizlet-topic-card__header-main">
                                                        {editingLessonId === group.id ? (
                                                            <input
                                                                className="form-control form-control-sm"
                                                                value={lessonTitleDraft}
                                                                onChange={(e) => setLessonTitleDraft(e.target.value)}
                                                                autoFocus
                                                                onBlur={() => commitLessonRename(group)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        commitLessonRename(group);
                                                                    }
                                                                    if (e.key === "Escape") {
                                                                        setLessonTitleDraft(group.title);
                                                                        setEditingLessonId(null);
                                                                    }
                                                                }}
                                                            />
                                                        ) : (
                                                            <Link
                                                                to={`/quizlet/lessons/${group.id}`}
                                                                className="text-decoration-none quizlet-topic-card__link-area"
                                                            >
                                                                <span className="quizlet-topic-card__title fw-semibold">
                                                                    {group.title}
                                                                </span>
                                                            </Link>
                                                        )}
                                                    </div>
                                                    <div className="d-flex gap-2 align-items-center flex-shrink-0 quizlet-lesson-delete-confirm-wrap">
                                                        <button
                                                            className="btn btn-sm btn-link p-0 text-muted quizlet-personal-topic-edit-btn"
                                                            title="Переименовать"
                                                            onClick={() => {
                                                                setEditingLessonId(group.id);
                                                                setLessonTitleDraft(group.title);
                                                            }}
                                                        >
                                                            <i className="bi bi-pencil" />
                                                        </button>
                                                        {confirmDeleteLessonId === group.id ? (
                                                            <button
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => {
                                                                    setConfirmDeleteLessonId(null);
                                                                    onDeleteLesson(group);
                                                                }}
                                                            >
                                                                Точно?
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="btn btn-sm btn-link p-0 text-danger quizlet-personal-topic-row-delete-btn"
                                                                title="Удалить"
                                                                onClick={() => setConfirmDeleteLessonId(group.id)}
                                                            >
                                                                ×
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="quizlet-topic-card__count text-muted">
                                                    <i className="bi bi-collection me-1" />
                                                    {lessonTopics.length} тем
                                                    <span className="mx-2">•</span>
                                                    <i className="bi bi-card-text me-1" />
                                                    {lessonWordCount} слов
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

interface LessonPageProps {
    group: TQuizletGroup;
    topics: TQuizletSubgroup[];
    subgroupWords: TQuizletSubgroupWord[];
    onCreateTopic: (groupId: number, title: string) => Promise<void>;
    onRenameTopic: (subgroup: TQuizletSubgroup, title: string) => Promise<void>;
    onMoveTopic: (groupId: number, subgroupId: number, direction: -1 | 1) => Promise<void>;
    onDeleteTopic: (subgroup: TQuizletSubgroup) => Promise<void>;
}

const LessonPage = ({
    group,
    topics,
    subgroupWords,
    onCreateTopic,
    onRenameTopic,
    onMoveTopic,
    onDeleteTopic,
}: LessonPageProps) => {
    const [newTopicTitle, setNewTopicTitle] = useState("");
    const [confirmDeleteTopicId, setConfirmDeleteTopicId] = useState<number | null>(null);
    const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
    const [topicTitleDraft, setTopicTitleDraft] = useState("");

    const handleCreate = async () => {
        const title = newTopicTitle.trim();
        if (title.length === 0) return;
        await onCreateTopic(group.id, title);
        setNewTopicTitle("");
    };

    const commitTopicRename = async (subgroup: TQuizletSubgroup) => {
        const nextTitle = topicTitleDraft.trim();
        if (nextTitle.length === 0 || nextTitle === subgroup.title) {
            setTopicTitleDraft(subgroup.title);
            setEditingTopicId(null);
            return;
        }
        await onRenameTopic(subgroup, nextTitle);
        setEditingTopicId(null);
    };

    useEffect(() => {
        if (confirmDeleteTopicId === null) return;

        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest(".quizlet-topic-delete-confirm-wrap")) return;
            setConfirmDeleteTopicId(null);
        };

        document.addEventListener("click", handleOutsideClick);
        return () => document.removeEventListener("click", handleOutsideClick);
    }, [confirmDeleteTopicId]);

    return (
        <>
            <QuizletBreadcrumbs group={group} />

            <div className="quizlet-main-container">
                <div className="mb-3 d-flex gap-2 align-items-center quizlet-personal-topic-create-row">
                    <input
                        className="form-control quizlet-personal-topic-create-input"
                        value={newTopicTitle}
                        onChange={(e) => setNewTopicTitle(e.target.value)}
                        placeholder="Topic title"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleCreate();
                            }
                        }}
                    />
                    <button className="btn btn-success btn-sm quizlet-personal-topic-create-btn" onClick={handleCreate}>
                        +
                    </button>
                </div>

                {topics.length === 0 && <p className="text-muted small mb-0">No topics yet. Create a topic above.</p>}

                {topics.length > 0 && (
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-2 pt-1">
                        {topics.map((subgroup, index) => (
                            <div className="col" key={subgroup.id}>
                                <div className="quizlet-topic-card-btn h-100">
                                    <div className="card quizlet-topic-card h-100">
                                        <div className="card-body d-flex flex-column">
                                            <div className="quizlet-topic-card__header">
                                                <OrderControls
                                                    index={index}
                                                    total={topics.length}
                                                    onMoveUp={() => onMoveTopic(group.id, subgroup.id, -1)}
                                                    onMoveDown={() => onMoveTopic(group.id, subgroup.id, 1)}
                                                />
                                                <div className="quizlet-topic-card__header-main">
                                                    {editingTopicId === subgroup.id ? (
                                                        <input
                                                            className="form-control form-control-sm"
                                                            value={topicTitleDraft}
                                                            onChange={(e) => setTopicTitleDraft(e.target.value)}
                                                            autoFocus
                                                            onBlur={() => commitTopicRename(subgroup)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    commitTopicRename(subgroup);
                                                                }
                                                                if (e.key === "Escape") {
                                                                    setTopicTitleDraft(subgroup.title);
                                                                    setEditingTopicId(null);
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <Link
                                                            to={`/quizlet/topics/${subgroup.id}`}
                                                            className="text-decoration-none quizlet-topic-card__link-area"
                                                        >
                                                            <span className="quizlet-topic-card__title">
                                                                {subgroup.title}
                                                            </span>
                                                        </Link>
                                                    )}
                                                </div>
                                                <div className="d-flex gap-2 align-items-center flex-shrink-0 quizlet-topic-delete-confirm-wrap">
                                                    <button
                                                        className="btn btn-sm btn-link p-0 text-muted quizlet-personal-topic-edit-btn"
                                                        title="Переименовать"
                                                        onClick={() => {
                                                            setEditingTopicId(subgroup.id);
                                                            setTopicTitleDraft(subgroup.title);
                                                        }}
                                                    >
                                                        <i className="bi bi-pencil" />
                                                    </button>
                                                    {confirmDeleteTopicId === subgroup.id ? (
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => {
                                                                setConfirmDeleteTopicId(null);
                                                                onDeleteTopic(subgroup);
                                                            }}
                                                        >
                                                            Точно?
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="btn btn-sm btn-link p-0 text-danger quizlet-personal-topic-row-delete-btn"
                                                            title="Удалить"
                                                            onClick={() => setConfirmDeleteTopicId(subgroup.id)}
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="quizlet-topic-card__count text-muted">
                                                <i className="bi bi-card-text me-1" />
                                                {
                                                    subgroupWords.filter((sw) => sw.subgroup_id === subgroup.id).length
                                                }{" "}
                                                слов
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

interface TopicPageProps {
    group: TQuizletGroup;
    subgroup: TQuizletSubgroup;
    words: TQuizletWord[];
    onDeleteTopic: (subgroup: TQuizletSubgroup) => Promise<void>;
    onWordsSaved: () => void;
}

const TopicPage = ({ group, subgroup, words, onDeleteTopic, onWordsSaved }: TopicPageProps) => {
    return (
        <>
            <QuizletBreadcrumbs group={group} subgroup={subgroup} />
            <div className="quizlet-main-container">
                <TopicEditor
                    subgroup={subgroup}
                    initialWords={words}
                    onDelete={() => onDeleteTopic(subgroup)}
                    onSaved={onWordsSaved}
                />
            </div>
        </>
    );
};

const TeacherQuizletManager = () => {
    const { lessonId, topicId } = useParams<{ lessonId?: string; topicId?: string }>();
    const navigate = useNavigate();

    const [loadStatus, setLoadStatus] = useState<LoadStatus.Type>(LoadStatus.NONE);
    const [groups, setGroups] = useState<TQuizletGroup[]>([]);
    const [subgroups, setSubgroups] = useState<TQuizletSubgroup[]>([]);
    const [subgroupWords, setSubgroupWords] = useState<TQuizletSubgroupWord[]>([]);
    const [words, setWords] = useState<TQuizletWord[]>([]);

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

    const activeLessonId = lessonId ? Number(lessonId) : undefined;
    const activeTopicId = topicId ? Number(topicId) : undefined;

    const activeGroup = useMemo(() => groups.find((group) => group.id === activeLessonId), [groups, activeLessonId]);

    const activeSubgroup = useMemo(
        () => subgroups.find((subgroup) => subgroup.id === activeTopicId),
        [subgroups, activeTopicId],
    );

    const activeSubgroupGroup = useMemo(() => {
        if (!activeSubgroup || activeSubgroup.group_id === undefined) return undefined;
        return groups.find((group) => group.id === activeSubgroup.group_id);
    }, [groups, activeSubgroup]);

    const getSubgroupWords = (subgroupId: number): TQuizletWord[] => {
        const ids = subgroupWords.filter((item) => item.subgroup_id === subgroupId).map((item) => item.word_id);
        return words.filter((word) => ids.includes(word.id));
    };

    const persistGroupOrder = async (orderedGroups: TQuizletGroup[]) => {
        const requests = orderedGroups
            .map((group, index) => {
                const nextSort = (index + 1) * QUIZLET_SORT_STEP;
                if (group.sort === nextSort) {
                    return null;
                }

                return AjaxPatch({
                    url: `/api/quizlet/groups/${group.id}`,
                    body: { title: group.title, sort: nextSort },
                });
            })
            .filter((request): request is ReturnType<typeof AjaxPatch> => request !== null);

        if (requests.length === 0) {
            return;
        }

        await Promise.all(requests);
        fetchCatalog();
    };

    const persistTopicOrder = async (orderedTopics: TQuizletSubgroup[]) => {
        const requests = orderedTopics
            .map((subgroup, index) => {
                const nextSort = (index + 1) * QUIZLET_SORT_STEP;
                if (subgroup.sort === nextSort) {
                    return null;
                }

                return AjaxPatch({
                    url: `/api/quizlet/subgroups/${subgroup.id}`,
                    body: { title: subgroup.title, sort: nextSort },
                });
            })
            .filter((request): request is ReturnType<typeof AjaxPatch> => request !== null);

        if (requests.length === 0) {
            return;
        }

        await Promise.all(requests);
        fetchCatalog();
    };

    const handleCreateLesson = async (title: string) => {
        const resp = await AjaxPost<GroupCreateResponse>({
            url: "/api/quizlet/groups",
            body: { title, sort: getNextSort(groups) },
        });
        fetchCatalog();
        navigate(`/quizlet/lessons/${resp.group.id}`);
    };

    const handleRenameLesson = async (group: TQuizletGroup, title: string) => {
        if (!title || title.trim().length === 0) return;
        await AjaxPatch({ url: `/api/quizlet/groups/${group.id}`, body: { title, sort: group.sort } });
        fetchCatalog();
    };

    const handleMoveLesson = async (groupId: number, direction: -1 | 1) => {
        await persistGroupOrder(moveItem(groups, groupId, direction));
    };

    const handleDeleteLesson = async (group: TQuizletGroup) => {
        await AjaxDelete({ url: `/api/quizlet/groups/${group.id}` });
        fetchCatalog();
        if (activeLessonId === group.id || (activeSubgroupGroup && activeSubgroupGroup.id === group.id)) {
            navigate("/quizlet");
        }
    };

    const handleCreateTopic = async (groupId: number, title: string) => {
        const topics = subgroups.filter((subgroup) => subgroup.group_id === groupId);
        const resp = await AjaxPost<SubgroupCreateResponse>({
            url: `/api/quizlet/groups/${groupId}/subgroups`,
            body: { title, sort: getNextSort(topics) },
        });
        fetchCatalog();
        navigate(`/quizlet/topics/${resp.subgroup.id}`);
    };

    const handleRenameTopic = async (subgroup: TQuizletSubgroup, title: string) => {
        if (!title || title.trim().length === 0) return;
        await AjaxPatch({ url: `/api/quizlet/subgroups/${subgroup.id}`, body: { title, sort: subgroup.sort } });
        fetchCatalog();
    };

    const handleMoveTopic = async (groupId: number, subgroupId: number, direction: -1 | 1) => {
        const topics = subgroups.filter((subgroup) => subgroup.group_id === groupId);
        await persistTopicOrder(moveItem(topics, subgroupId, direction));
    };

    const handleDeleteTopic = async (subgroup: TQuizletSubgroup) => {
        await AjaxDelete({ url: `/api/quizlet/subgroups/${subgroup.id}` });
        fetchCatalog();
        if (activeTopicId === subgroup.id) {
            if (subgroup.group_id) {
                navigate(`/quizlet/lessons/${subgroup.group_id}`);
            } else {
                navigate("/quizlet");
            }
        }
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
            <div className="quizlet-personal-dictionary-page" style={{ maxWidth: "760px", margin: "0 auto" }}>
                {!activeLessonId && !activeTopicId && (
                    <LessonsPage
                        groups={groups}
                        subgroups={subgroups}
                        subgroupWords={subgroupWords}
                        onCreateLesson={handleCreateLesson}
                        onRenameLesson={handleRenameLesson}
                        onMoveLesson={handleMoveLesson}
                        onDeleteLesson={handleDeleteLesson}
                    />
                )}

                {activeLessonId && !activeTopicId && activeGroup && (
                    <LessonPage
                        group={activeGroup}
                        topics={subgroups.filter((subgroup) => subgroup.group_id === activeGroup.id)}
                        subgroupWords={subgroupWords}
                        onCreateTopic={handleCreateTopic}
                        onRenameTopic={handleRenameTopic}
                        onMoveTopic={handleMoveTopic}
                        onDeleteTopic={handleDeleteTopic}
                    />
                )}

                {activeTopicId && activeSubgroup && activeSubgroupGroup && (
                    <TopicPage
                        group={activeSubgroupGroup}
                        subgroup={activeSubgroup}
                        words={getSubgroupWords(activeSubgroup.id)}
                        onDeleteTopic={handleDeleteTopic}
                        onWordsSaved={fetchCatalog}
                    />
                )}

                {activeLessonId && !activeGroup && (
                    <div className="quizlet-main-container">
                        <h5 className="mb-2">Lesson not found</h5>
                        <p className="text-muted mb-3">The selected lesson does not exist.</p>
                        <div>
                            <button className="btn btn-outline-primary" onClick={() => navigate("/quizlet")}>
                                Back to lessons
                            </button>
                        </div>
                    </div>
                )}

                {activeTopicId && (!activeSubgroup || !activeSubgroupGroup) && (
                    <div className="quizlet-main-container">
                        <h5 className="mb-2">Topic not found</h5>
                        <p className="text-muted mb-3">The selected topic does not exist.</p>
                        <div>
                            <button className="btn btn-outline-primary" onClick={() => navigate("/quizlet")}>
                                Back to lessons
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherQuizletManager;
