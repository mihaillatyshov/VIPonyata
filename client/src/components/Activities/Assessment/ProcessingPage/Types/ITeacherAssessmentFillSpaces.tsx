import React, { useLayoutEffect, useRef, useState } from "react";

import { ReactMarkdownWithHtml } from "components/Common/ReactMarkdownWithHtml";
import {
    TTeacherAssessmentFillSpacesByHand,
    TTeacherAssessmentFillSpacesExists,
} from "models/Activity/Items/TAssessmentItems";

import styles from "./Style.module.css";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";

type TTeacherAssessmentFillSpaceType = TTeacherAssessmentFillSpacesExists | TTeacherAssessmentFillSpacesByHand;

const normalizeCell = (value: string | undefined): string => (value ?? "").trim();

const parseClipboardRows = (text: string): string[] =>
    text
        .split(/\r?\n/)
        .map((line) => line.split("\t")[0] ?? "")
        .map((cell) => cell.trim())
        .filter((cell) => cell !== "");

const toRows = (separates: string[], meta_answers: string[]): string[] => {
    const rows: string[] = [];
    for (let i = 0; i < meta_answers.length; i++) {
        rows.push(separates[i] ?? "");
        rows.push(meta_answers[i] ?? "");
    }

    const trailingText = separates[meta_answers.length] ?? separates.at(-1) ?? "";
    if (meta_answers.length === 0 || normalizeCell(trailingText) !== "") {
        rows.push(trailingText);
    }

    return rows.length > 0 ? rows : [""];
};

const toTaskData = (rows: string[]): { separates: string[]; meta_answers: string[] } => {
    const separates: string[] = [];
    const meta_answers: string[] = [];

    rows.forEach((value, index) => {
        if (index % 2 === 0) {
            separates.push(value);
        } else {
            meta_answers.push(value);
        }
    });

    if (separates.length === meta_answers.length) {
        separates.push("");
    }

    if (separates.length === 0) {
        separates.push("");
    }

    return { separates, meta_answers };
};

const ITeacherAssessmentFillSpaces = <T extends TTeacherAssessmentFillSpaceType>({
    data,
    taskUUID,
    onChangeTask,
}: TeacherAssessmentTypeProps<T>) => {
    const tableRef = useRef<HTMLTableElement>(null);
    const focusPending = useRef<{ rowIndex: number; caretPosition?: number } | null>(null);
    const [focusVersion, setFocusVersion] = useState(0);

    const rows = toRows(data.separates, data.meta_answers);

    useLayoutEffect(() => {
        if (focusPending.current === null) {
            return;
        }

        const { rowIndex, caretPosition } = focusPending.current;
        focusPending.current = null;

        const tbody = tableRef.current?.querySelector("tbody");
        const input = tbody?.rows[rowIndex]?.cells[1]?.querySelector<HTMLInputElement>("input");
        if (!input) {
            return;
        }

        input.focus();
        if (caretPosition === undefined) {
            input.select();
            return;
        }

        const safePos = Math.max(0, Math.min(caretPosition, input.value.length));
        input.setSelectionRange(safePos, safePos);
    }, [rows.length, focusVersion]);

    const requestFocus = (rowIndex: number, caretPosition?: number, forceRender = false) => {
        focusPending.current = { rowIndex, caretPosition };
        if (forceRender) {
            setFocusVersion((v) => v + 1);
        }
    };

    const updateRows = (nextRows: string[]) => {
        const nextData = toTaskData(nextRows);
        onChangeTask({ ...data, ...nextData });
    };

    const updateCell = (rowIndex: number, value: string) => {
        const nextRows = [...rows];
        nextRows[rowIndex] = value;
        updateRows(nextRows);
    };

    const addRowAfter = (rowIndex: number) => {
        const nextRows = [...rows];
        nextRows.splice(rowIndex + 1, 0, "");
        requestFocus(rowIndex + 1);
        updateRows(nextRows);
    };

    const splitRowByCaret = (rowIndex: number, start: number, end: number) => {
        const currentValue = rows[rowIndex] ?? "";
        const head = currentValue.slice(0, start);
        const tail = currentValue.slice(end);
        const nextRows = [...rows];
        nextRows[rowIndex] = head;
        nextRows.splice(rowIndex + 1, 0, tail);
        requestFocus(rowIndex + 1, 0);
        updateRows(nextRows);
    };

    const removeRow = (rowIndex: number) => {
        const nextRows = rows.filter((_, i) => i !== rowIndex);
        updateRows(nextRows.length > 0 ? nextRows : [""]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number) => {
        if (e.key === "Enter" && e.shiftKey) {
            e.preventDefault();
            const start = e.currentTarget.selectionStart ?? e.currentTarget.value.length;
            const end = e.currentTarget.selectionEnd ?? start;
            splitRowByCaret(rowIndex, start, end);
            return;
        }

        if (e.key === "Enter") {
            e.preventDefault();
            if (rowIndex === rows.length - 1) {
                addRowAfter(rowIndex);
            } else {
                requestFocus(rowIndex + 1, undefined, true);
            }
            return;
        }

        if (e.key !== "Tab") {
            return;
        }

        e.preventDefault();
        if (e.shiftKey) {
            if (rowIndex > 0) {
                requestFocus(rowIndex - 1, undefined, true);
            }
            return;
        }

        if (rowIndex < rows.length - 1) {
            requestFocus(rowIndex + 1, undefined, true);
        } else {
            addRowAfter(rowIndex);
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTableElement>) => {
        const text = e.clipboardData.getData("text");
        if (!text.includes("\n") && !text.includes("\t")) {
            return;
        }

        const pastedRows = parseClipboardRows(text);
        if (pastedRows.length === 0) {
            return;
        }

        e.preventDefault();
        const nonEmptyRows = rows.filter((row) => normalizeCell(row) !== "");
        updateRows([...nonEmptyRows, ...pastedRows]);
    };

    const renderResult = toTaskData(rows);

    return (
        <div className={styles.findPair}>
            <div className={styles.findPairHint}>Скопируйте столбец из Excel и вставьте строки в таблицу.</div>
            <div className={`table-responsive ${styles.findPairTableWrap}`}>
                <table
                    ref={tableRef}
                    className={`table table-sm table-bordered align-middle mb-0 ${styles.findPairTable}`}
                    onPaste={handlePaste}
                >
                    <tbody>
                        {rows.map((rowValue, rowIndex) => (
                            <tr
                                key={`${taskUUID}_${rowIndex}`}
                                className={rowIndex % 2 === 0 ? styles.fillSpacesTextRow : styles.fillSpacesGapRow}
                            >
                                <td className={styles.fillSpacesKindCell}>
                                    {rowIndex % 2 === 0 ? (
                                        <span className={`badge ${styles.fillSpacesKindBadgeText}`}>Текст</span>
                                    ) : (
                                        <span className={`badge ${styles.fillSpacesKindBadgeGap}`}>Пропуск</span>
                                    )}
                                </td>
                                <td className="p-0">
                                    <input
                                        type="text"
                                        className={`form-control form-control-sm border-0 rounded-0 shadow-none ${styles.findPairInput}`}
                                        style={{ background: "transparent" }}
                                        value={rowValue}
                                        onChange={(e) => updateCell(rowIndex, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, rowIndex)}
                                        placeholder={rowIndex % 2 === 0 ? "текст" : "пропуск"}
                                    />
                                </td>
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
            <div className={styles.findPairFooterHint}>Enter: следующая строка. Tab: переход по строкам.</div>
            <div>
                <div>Результат: </div>
                <div className="d-flex flex-wrap">
                    &nbsp;
                    {renderResult.meta_answers.map((answer, i) => (
                        <React.Fragment key={i}>
                            <div className="prevent-select me-2 md-last-no-margin">
                                <ReactMarkdownWithHtml>{renderResult.separates[i]}</ReactMarkdownWithHtml>
                            </div>
                            <div className={`prevent-select md-last-no-margin ${styles.fillSpacesResultAnswer} me-2`}>
                                <ReactMarkdownWithHtml>{answer}</ReactMarkdownWithHtml>
                            </div>
                        </React.Fragment>
                    ))}
                    <div className="prevent-select me-2 md-last-no-margin">
                        <ReactMarkdownWithHtml>{renderResult.separates.at(-1) || ""}</ReactMarkdownWithHtml>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ITeacherAssessmentFillSpaces;
