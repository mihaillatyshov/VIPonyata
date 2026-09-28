import { useEffect, useMemo, useRef, useState } from "react";

import { TReviewWordFields } from "api/review";
import { TReviewWord } from "models/TReview";

import { normalizeText } from "./reviewTraining";

interface EditorRow {
    key: string;
    id?: number;
    source: string;
    word_jp: string;
    ru: string;
    note: string;
    examples: string;
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

const isRowEmpty = (row: EditorRow) =>
    normalizeText(row.source) === "" &&
    normalizeText(row.word_jp) === "" &&
    normalizeText(row.ru) === "" &&
    normalizeText(row.note) === "" &&
    normalizeText(row.examples) === "";

type RowFields = Omit<EditorRow, "key" | "id">;

const wordToFields = (word: TReviewWord): RowFields => ({
    source: word.source ?? "",
    word_jp: word.word_jp,
    ru: word.ru,
    note: word.note ?? "",
    examples: word.examples ?? "",
});

const rowToPayload = (row: EditorRow): TReviewWordFields => ({
    source: normalizeText(row.source) || null,
    word_jp: normalizeText(row.word_jp),
    ru: normalizeText(row.ru),
    note: normalizeText(row.note) || null,
    examples: normalizeText(row.examples) || null,
});

export interface ReviewWordsChanges {
    deletedIds: number[];
    created: TReviewWordFields[];
    updated: Array<TReviewWordFields & { id: number }>;
}

interface ReviewTopicEditorProps {
    initialWords: TReviewWord[];
    /** Сохраняет изменения и возвращает актуальные слова топика — таблица перерисуется по ним. */
    onSave: (changes: ReviewWordsChanges) => Promise<TReviewWord[]>;
}

/** Таблица карточек топика. Состояние берётся из `initialWords` один раз — для другого топика нужен новый `key`. */
const ReviewTopicEditor = ({ initialWords, onSave }: ReviewTopicEditorProps) => {
    const [rows, setRows] = useState<EditorRow[]>(() =>
        initialWords.length > 0 ? wordsToRows(initialWords) : [makeEmptyRow()],
    );
    const [savedWords, setSavedWords] = useState<TReviewWord[]>(initialWords);
    const [deletedIds, setDeletedIds] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const inputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());
    const pendingFocusRowKeyRef = useRef<string | null>(null);

    const committedRows = useMemo(() => new Map(savedWords.map((word) => [word.id, wordToFields(word)])), [savedWords]);

    const isRowChanged = (row: EditorRow) => {
        const committed = row.id === undefined ? undefined : committedRows.get(row.id);
        return committed === undefined || ROW_FIELDS.some((field) => committed[field] !== row[field]);
    };

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

    const isDirty = deletedIds.length > 0 || rows.some((row) => !isRowEmpty(row) && isRowChanged(row));

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
        const nonEmptyRows = rows.filter((row) => !isRowEmpty(row));
        const changes: ReviewWordsChanges = {
            deletedIds,
            created: nonEmptyRows.filter((row) => row.id === undefined).map(rowToPayload),
            updated: nonEmptyRows
                .filter((row) => row.id !== undefined && isRowChanged(row))
                .map((row) => ({ id: row.id!, ...rowToPayload(row) })),
        };

        setIsSaving(true);
        setSaveError(null);

        try {
            const freshWords = await onSave(changes);
            setSavedWords(freshWords);
            setRows(freshWords.length > 0 ? wordsToRows(freshWords) : [makeEmptyRow()]);
            setDeletedIds([]);
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

export default ReviewTopicEditor;
