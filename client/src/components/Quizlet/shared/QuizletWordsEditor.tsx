import { ReactNode, useLayoutEffect, useMemo, useRef, useState } from "react";

import { TQuizletWordFields } from "api/quizlet";
import { TQuizletWord } from "models/TQuizlet";

import { copyTableRowsAsTsv, useQuizletTableSelection } from "../quizletTableClipboard";

interface EditorRow {
    key: string;
    id?: number;
    char_jp: string;
    word_jp: string;
    ru: string;
}

const COLS = ["char_jp", "word_jp", "ru"] as const;
type ColField = (typeof COLS)[number];

const PLACEHOLDERS: Record<ColField, string> = {
    char_jp: "漢字",
    word_jp: "かな",
    ru: "перевод",
};

let rowKeyCounter = 0;
const makeKey = () => `row_${++rowKeyCounter}`;
const makeEmptyRow = (): EditorRow => ({ key: makeKey(), char_jp: "", word_jp: "", ru: "" });

const wordsToRows = (words: TQuizletWord[]): EditorRow[] =>
    words.length > 0
        ? words.map((word) => ({
              key: makeKey(),
              id: word.id,
              char_jp: word.char_jp ?? "",
              word_jp: word.word_jp,
              ru: word.ru,
          }))
        : [makeEmptyRow()];

const isAllEmpty = (row: EditorRow) => row.char_jp.trim() === "" && row.word_jp.trim() === "" && row.ru.trim() === "";

const isJpEmpty = (row: EditorRow) => row.char_jp.trim() === "" && row.word_jp.trim() === "";

const rowToFields = (row: EditorRow): TQuizletWordFields => ({
    char_jp: row.char_jp.trim() || null,
    word_jp: row.word_jp,
    ru: row.ru,
});

const isRowChanged = (row: EditorRow, original: TQuizletWord | undefined) =>
    original === undefined ||
    (original.char_jp ?? "") !== row.char_jp ||
    original.word_jp !== row.word_jp ||
    original.ru !== row.ru;

export interface QuizletWordsChanges {
    deletedIds: number[];
    created: TQuizletWordFields[];
    updated: Array<TQuizletWordFields & { id: number }>;
}

interface QuizletWordsEditorProps {
    initialWords: TQuizletWord[];
    /** Сохраняет изменения и возвращает актуальный список слов темы — редактор перерисуется по нему. */
    onSave: (changes: QuizletWordsChanges) => Promise<TQuizletWord[]>;
    readingLabel?: string;
    /** Подсвечивать повторы чтения (кана), а не только кандзи. */
    checkReadingDuplicates?: boolean;
    /** Кнопка «Сохранить» видна всегда (неактивна без изменений); иначе появляется только при изменениях. */
    alwaysShowSaveButton?: boolean;
    /** Содержимое последней ячейки заголовка (например, удаление темы). */
    headerAction?: ReactNode;
}

/**
 * Таблица слов темы Quizlet: редактирование ячеек, Enter/Tab между ячейками, вставка и копирование блоков из Excel.
 * Состояние инициализируется из `initialWords` один раз — для другой темы компонент нужно перемонтировать (`key`).
 */
const QuizletWordsEditor = ({
    initialWords,
    onSave,
    readingLabel = "Чтение",
    checkReadingDuplicates = false,
    alwaysShowSaveButton = false,
    headerAction,
}: QuizletWordsEditorProps) => {
    const [savedWords, setSavedWords] = useState<TQuizletWord[]>(initialWords);
    const [rows, setRows] = useState<EditorRow[]>(() => wordsToRows(initialWords));
    const [deletedIds, setDeletedIds] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const tableRef = useRef<HTMLTableElement>(null);
    const focusPending = useRef<{ rowIndex: number; col: number } | null>(null);
    const { selection, handleCellMouseDown, handleCellMouseEnter, handleCellFocus, isCellSelected } =
        useQuizletTableSelection(rows.length, COLS.length);

    const savedWordsById = useMemo(() => new Map(savedWords.map((word) => [word.id, word])), [savedWords]);

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

    const moveFocus = (rowIndex: number, col: number) => {
        focusPending.current = { rowIndex, col };
        // Новый массив — чтобы сработал layout-эффект фокуса.
        setRows((prev) => [...prev]);
    };

    const rowFlags = useMemo(() => {
        const flags = new Map<string, { danger: boolean; warning: boolean }>();
        const charSeen = new Map<string, string>();
        const kanaSeen = new Map<string, string>();

        const markDuplicate = (seen: Map<string, string>, value: string, rowKey: string) => {
            if (!value) {
                return false;
            }
            const firstRowKey = seen.get(value);
            if (firstRowKey === undefined) {
                seen.set(value, rowKey);
                return false;
            }
            const firstFlags = flags.get(firstRowKey);
            if (firstFlags) flags.set(firstRowKey, { ...firstFlags, warning: true });
            return true;
        };

        for (const row of rows) {
            let danger = false;
            let warning = false;

            if (!isAllEmpty(row) && isJpEmpty(row)) {
                danger = true;
            }

            if (!isAllEmpty(row) && !isJpEmpty(row)) {
                const charDuplicate = markDuplicate(charSeen, row.char_jp.trim(), row.key);
                const kanaDuplicate = checkReadingDuplicates && markDuplicate(kanaSeen, row.word_jp.trim(), row.key);
                warning = charDuplicate || kanaDuplicate;
            }

            flags.set(row.key, { danger, warning });
        }

        return flags;
    }, [rows, checkReadingDuplicates]);

    const isDirty = useMemo(() => {
        if (deletedIds.length > 0) return true;
        const currentIds = new Set<number>();

        for (const row of rows) {
            if (isAllEmpty(row)) continue;
            if (row.id === undefined) return true;
            currentIds.add(row.id);
            if (isRowChanged(row, savedWordsById.get(row.id))) return true;
        }

        return savedWords.some((word) => !currentIds.has(word.id));
    }, [rows, deletedIds, savedWords, savedWordsById]);

    const hasIssues = Array.from(rowFlags.values()).some((flag) => flag.danger || flag.warning);

    const updateCell = (rowKey: string, field: ColField, value: string) => {
        setRows((prev) => prev.map((row) => (row.key === rowKey ? { ...row, [field]: value } : row)));
    };

    const addRowAfter = (afterIndex: number) => {
        const newRow = makeEmptyRow();
        focusPending.current = { rowIndex: afterIndex + 1, col: 0 };
        setRows((prev) => {
            const next = [...prev];
            next.splice(afterIndex + 1, 0, newRow);
            return next;
        });
    };

    const removeRow = (rowIndex: number) => {
        const removedId = rows[rowIndex].id;
        if (removedId !== undefined) {
            setDeletedIds((prev) => [...prev, removedId]);
        }
        setRows((prev) => {
            const next = prev.filter((_, index) => index !== rowIndex);
            return next.length === 0 ? [makeEmptyRow()] : next;
        });
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
        const isLastRow = rowIndex === rows.length - 1;

        if (event.key === "Enter") {
            event.preventDefault();
            if (isLastRow) {
                addRowAfter(rowIndex);
            } else {
                moveFocus(rowIndex + 1, 0);
            }
            return;
        }

        if (event.key !== "Tab") {
            return;
        }

        const nextCol = colIndex + (event.shiftKey ? -1 : 1);

        if (nextCol >= 0 && nextCol < COLS.length) {
            event.preventDefault();
            moveFocus(rowIndex, nextCol);
        } else if (!event.shiftKey && nextCol >= COLS.length) {
            event.preventDefault();
            if (isLastRow) {
                addRowAfter(rowIndex);
            } else {
                moveFocus(rowIndex + 1, 0);
            }
        } else if (event.shiftKey && nextCol < 0 && rowIndex > 0) {
            event.preventDefault();
            moveFocus(rowIndex - 1, COLS.length - 1);
        }
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLTableElement>) => {
        const text = event.clipboardData.getData("text");
        if (!text.includes("\t") && !text.includes("\n")) return;
        event.preventDefault();

        const pastedRows: EditorRow[] = text
            .split(/\r?\n/)
            .filter((line) => line.trim() !== "")
            .map((line) => {
                const cells = line.split("\t").map((cell) => cell.trim());
                return { key: makeKey(), char_jp: cells[0] ?? "", word_jp: cells[1] ?? "", ru: cells[2] ?? "" };
            });

        if (pastedRows.length === 0) return;

        setRows((prev) => [...prev.filter((row) => !isAllEmpty(row)), ...pastedRows]);
    };

    const handleCopy = (event: React.ClipboardEvent<HTMLTableElement>) => {
        copyTableRowsAsTsv(event, rows, COLS, isAllEmpty, selection);
    };

    const handleSave = async () => {
        const nonEmptyRows = rows.filter((row) => !isAllEmpty(row));
        const changes: QuizletWordsChanges = {
            deletedIds,
            created: nonEmptyRows.filter((row) => row.id === undefined).map(rowToFields),
            updated: nonEmptyRows
                .filter((row) => row.id !== undefined && isRowChanged(row, savedWordsById.get(row.id)))
                .map((row) => ({ id: row.id!, ...rowToFields(row) })),
        };

        setIsSaving(true);
        setSaveError(null);
        try {
            const freshWords = await onSave(changes);
            setSavedWords(freshWords);
            setRows(wordsToRows(freshWords));
            setDeletedIds([]);
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
                    onCopy={handleCopy}
                    onPaste={handlePaste}
                >
                    <thead>
                        <tr className="table-light">
                            <th className="quizlet-dictionary-table-head" style={{ width: "28%" }}>
                                Кандзи
                            </th>
                            <th className="quizlet-dictionary-table-head" style={{ width: "28%" }}>
                                {readingLabel}
                            </th>
                            <th className="quizlet-dictionary-table-head" style={{ width: "37%" }}>
                                Перевод
                            </th>
                            <th style={{ width: headerAction ? "11%" : "5%" }}>{headerAction}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => {
                            const flag = rowFlags.get(row.key) ?? { danger: false, warning: false };
                            const rowClass = flag.danger ? "table-danger" : flag.warning ? "table-warning" : "";

                            return (
                                <tr key={row.key} className={rowClass}>
                                    {COLS.map((field, colIndex) => (
                                        <td
                                            key={field}
                                            className={`p-0${isCellSelected(rowIndex, colIndex) ? " quizlet-table-cell-selected" : ""}`}
                                            onMouseDown={(event) => handleCellMouseDown(event, rowIndex, colIndex)}
                                            onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                                        >
                                            <input
                                                type="text"
                                                className="form-control form-control-sm border-0 rounded-0 shadow-none quizlet-personal-topic-editor-input"
                                                style={{ background: "transparent" }}
                                                value={row[field]}
                                                onChange={(event) => updateCell(row.key, field, event.target.value)}
                                                onFocus={() => handleCellFocus(rowIndex, colIndex)}
                                                onKeyDown={(event) => handleKeyDown(event, rowIndex, colIndex)}
                                                placeholder={PLACEHOLDERS[field]}
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
                    {(alwaysShowSaveButton || isDirty || isSaving) && (
                        <button className="btn btn-success" onClick={handleSave} disabled={isSaving || !isDirty}>
                            {isSaving ? "Сохранение..." : "Сохранить"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizletWordsEditor;
