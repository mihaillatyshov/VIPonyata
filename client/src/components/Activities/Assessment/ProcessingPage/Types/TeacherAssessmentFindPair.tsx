import React, { useLayoutEffect, useRef, useState } from "react";

import { TTeacherAssessmentFindPair } from "models/Activity/Items/TAssessmentItems";

import styles from "./Style.module.css";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";

const COLS = ["meta_first", "meta_second"] as const;
type TColNames = (typeof COLS)[number];

interface PairRow {
    meta_first: string;
    meta_second: string;
}

const makeEmptyRow = (): PairRow => ({ meta_first: "", meta_second: "" });

const toRows = (meta_first: string[], meta_second: string[]): PairRow[] => {
    const maxLength = Math.max(meta_first.length, meta_second.length);

    if (maxLength === 0) {
        return [makeEmptyRow()];
    }

    return Array.from({ length: maxLength }, (_, index) => ({
        meta_first: meta_first[index] ?? "",
        meta_second: meta_second[index] ?? "",
    }));
};

const toTaskData = (rows: PairRow[]): Pick<TTeacherAssessmentFindPair, TColNames> => ({
    meta_first: rows.map((row) => row.meta_first),
    meta_second: rows.map((row) => row.meta_second),
});

const isRowEmpty = (row: PairRow) => row.meta_first.trim() === "" && row.meta_second.trim() === "";

const parseClipboardPairs = (text: string): PairRow[] =>
    text
        .split(/\r?\n/)
        .filter((line) => line.trim() !== "")
        .map((line) => {
            const cells = line.split("\t");
            return {
                meta_first: (cells[0] ?? "").trim(),
                meta_second: (cells[1] ?? "").trim(),
            };
        });

const TeacherAssessmentFindPair = ({
    data,
    taskUUID,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentFindPair>) => {
    const tableRef = useRef<HTMLTableElement>(null);
    const focusPending = useRef<{ rowIndex: number; colIndex: number } | null>(null);
    const [focusVersion, setFocusVersion] = useState(0);

    const rows = toRows(data.meta_first, data.meta_second);

    useLayoutEffect(() => {
        if (!focusPending.current) return;

        const { rowIndex, colIndex } = focusPending.current;
        focusPending.current = null;

        const tbody = tableRef.current?.querySelector("tbody");
        if (!tbody) return;

        const input = tbody.rows[rowIndex]?.cells[colIndex]?.querySelector<HTMLInputElement>("input");
        input?.focus();
        input?.select();
    }, [rows.length, focusVersion]);

    const requestFocus = (rowIndex: number, colIndex: number, forceRender = false) => {
        focusPending.current = { rowIndex, colIndex };
        if (forceRender) {
            setFocusVersion((value) => value + 1);
        }
    };

    const updateRows = (nextRows: PairRow[]) => {
        onChangeTask({ ...data, ...toTaskData(nextRows) });
    };

    const updateCell = (rowIndex: number, colName: TColNames, value: string) => {
        const nextRows = rows.map((row, index) => (index === rowIndex ? { ...row, [colName]: value } : row));
        updateRows(nextRows);
    };

    const addRowAfter = (rowIndex: number) => {
        const nextRows = [...rows];
        nextRows.splice(rowIndex + 1, 0, makeEmptyRow());
        requestFocus(rowIndex + 1, 0);
        updateRows(nextRows);
    };

    const removeRow = (rowIndex: number) => {
        const nextRows = rows.filter((_, index) => index !== rowIndex);
        updateRows(nextRows.length > 0 ? nextRows : []);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
        if (e.key === "Enter") {
            e.preventDefault();

            if (rowIndex === rows.length - 1) {
                addRowAfter(rowIndex);
            } else {
                requestFocus(rowIndex + 1, 0, true);
            }
            return;
        }

        if (e.key !== "Tab") {
            return;
        }

        const nextCol = colIndex + (e.shiftKey ? -1 : 1);

        if (nextCol >= 0 && nextCol < COLS.length) {
            e.preventDefault();
            requestFocus(rowIndex, nextCol, true);
            return;
        }

        if (!e.shiftKey && nextCol >= COLS.length) {
            e.preventDefault();
            if (rowIndex < rows.length - 1) {
                requestFocus(rowIndex + 1, 0, true);
            } else {
                addRowAfter(rowIndex);
            }
            return;
        }

        if (e.shiftKey && nextCol < 0 && rowIndex > 0) {
            e.preventDefault();
            requestFocus(rowIndex - 1, COLS.length - 1, true);
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTableElement>) => {
        const text = e.clipboardData.getData("text");
        if (!text.includes("\t") && !text.includes("\n")) return;

        e.preventDefault();
        const pastedRows = parseClipboardPairs(text);
        if (pastedRows.length === 0) return;

        const nonEmptyRows = rows.filter((row) => !isRowEmpty(row));
        updateRows([...nonEmptyRows, ...pastedRows]);
    };

    return (
        <div className={styles.findPair}>
            <div className={styles.findPairActions}>
                <div className={styles.findPairHint}>Скопируйте 2 столбца из Excel и вставьте их прямо в таблицу.</div>
            </div>
            <div className={`table-responsive ${styles.findPairTableWrap}`}>
                <table
                    ref={tableRef}
                    className={`table table-sm table-bordered align-middle mb-0 ${styles.findPairTable}`}
                    onPaste={handlePaste}
                >
                    <thead>
                        <tr>
                            <th className={styles.findPairTableHead}>1 столбец</th>
                            <th className={styles.findPairTableHead}>2 столбец</th>
                            <th className={styles.findPairDeleteHead}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr key={`${taskUUID}_${rowIndex}`}>
                                {COLS.map((colName, colIndex) => (
                                    <td key={colName} className="p-0">
                                        <input
                                            type="text"
                                            className={`form-control form-control-sm border-0 rounded-0 shadow-none ${styles.findPairInput}`}
                                            style={{ background: "transparent" }}
                                            value={row[colName]}
                                            onChange={(e) => updateCell(rowIndex, colName, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                                            placeholder={colIndex === 0 ? "левая часть пары" : "правая часть пары"}
                                        />
                                    </td>
                                ))}
                                <td className={styles.findPairDeleteCell}>
                                    <div className="d-flex justify-content-center align-items-center h-100">
                                        <button
                                            className="btn btn-link p-0 text-danger"
                                            type="button"
                                            title="Удалить строку"
                                            onClick={() => removeRow(rowIndex)}
                                        >
                                            <i className="bi bi-x-lg" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className={styles.findPairFooterHint}>
                Enter: следующая строка. Tab: переход между ячейками. Вставка из Excel добавляет пары в конец таблицы.
            </div>
        </div>
    );
};

export default TeacherAssessmentFindPair;
