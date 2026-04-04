import React, { useLayoutEffect, useRef, useState } from "react";

import { TTeacherAssessmentSentenceOrder } from "models/Activity/Items/TAssessmentItems";

import styles from "./Style.module.css";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";

const normalizeCell = (value: string | undefined): string => (value ?? "").trim();

const parseClipboardLines = (text: string): string[] =>
    text
        .split(/\r?\n/)
        .map((line) => line.split("\t")[0] ?? "")
        .map((cell) => cell.trim())
        .filter((cell) => cell !== "");

const TeacherAssessmentSentenceOrder = ({
    data,
    taskUUID,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentSentenceOrder>) => {
    const tableRef = useRef<HTMLTableElement>(null);
    const focusPending = useRef<number | null>(null);
    const [focusVersion, setFocusVersion] = useState(0);

    const parts = data.meta_parts.length > 0 ? data.meta_parts : [""];

    useLayoutEffect(() => {
        if (focusPending.current === null) {
            return;
        }

        const rowIndex = focusPending.current;
        focusPending.current = null;

        const tbody = tableRef.current?.querySelector("tbody");
        const input = tbody?.rows[rowIndex]?.cells[0]?.querySelector<HTMLInputElement>("input");
        input?.focus();
        input?.select();
    }, [parts.length, focusVersion]);

    const requestFocus = (rowIndex: number, forceRender = false) => {
        focusPending.current = rowIndex;
        if (forceRender) {
            setFocusVersion((v) => v + 1);
        }
    };

    const updateParts = (nextParts: string[]) => {
        onChangeTask({ ...data, meta_parts: nextParts });
    };

    const updateCell = (rowIndex: number, value: string) => {
        const next = [...parts];
        next[rowIndex] = value;
        updateParts(next);
    };

    const addRowAfter = (rowIndex: number) => {
        const next = [...parts];
        next.splice(rowIndex + 1, 0, "");
        requestFocus(rowIndex + 1);
        updateParts(next);
    };

    const removeRow = (rowIndex: number) => {
        const next = parts.filter((_, i) => i !== rowIndex);
        updateParts(next.length > 0 ? next : [""]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (rowIndex === parts.length - 1) {
                addRowAfter(rowIndex);
            } else {
                requestFocus(rowIndex + 1, true);
            }
            return;
        }

        if (e.key === "Tab") {
            e.preventDefault();
            if (!e.shiftKey) {
                if (rowIndex < parts.length - 1) {
                    requestFocus(rowIndex + 1, true);
                } else {
                    addRowAfter(rowIndex);
                }
            } else if (rowIndex > 0) {
                requestFocus(rowIndex - 1, true);
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTableElement>) => {
        const text = e.clipboardData.getData("text");
        if (!text.includes("\n")) {
            return;
        }

        e.preventDefault();
        const lines = parseClipboardLines(text);
        if (lines.length === 0) {
            return;
        }

        const nonEmpty = parts.filter((p) => normalizeCell(p) !== "");
        updateParts([...nonEmpty, ...lines]);
    };

    const counts = new Map<string, number>();
    parts.forEach((raw) => {
        const value = normalizeCell(raw);
        if (value !== "") {
            counts.set(value, (counts.get(value) ?? 0) + 1);
        }
    });
    const duplicateSet = new Set(
        Array.from(counts.entries())
            .filter(([, c]) => c > 1)
            .map(([v]) => v),
    );

    const emptyRows = parts
        .map((p, i) => (normalizeCell(p) === "" ? i + 1 : null))
        .filter((i): i is number => i !== null);

    const duplicateList = Array.from(duplicateSet);

    return (
        <div className={styles.findPair}>
            <div className={styles.findPairActions}>
                <div className={styles.findPairHint}>
                    Скопируйте столбец из Excel и вставьте его прямо в таблицу. Данные добавятся в конец.
                </div>
            </div>

            <div className={`table-responsive ${styles.findPairTableWrap}`}>
                <table
                    ref={tableRef}
                    className={`table table-sm table-bordered align-middle mb-0 ${styles.findPairTable}`}
                    onPaste={handlePaste}
                >
                    <tbody>
                        {parts.map((value, rowIndex) => {
                            const normalizedValue = normalizeCell(value);
                            const isDuplicate = normalizedValue !== "" && duplicateSet.has(normalizedValue);

                            return (
                                <tr key={`${taskUUID}_${rowIndex}`}>
                                    <td className={styles.sentenceOrderNumCell}>
                                        <span className={styles.sentenceOrderNum}>{rowIndex + 1}</span>
                                    </td>
                                    <td className="p-0">
                                        <div className={styles.duplicateCellWrap}>
                                            <input
                                                type="text"
                                                className={`form-control form-control-sm border-0 rounded-0 shadow-none ${
                                                    styles.findPairInput
                                                } ${isDuplicate ? styles.duplicateCellInput : ""}`}
                                                style={{ background: "transparent" }}
                                                value={value}
                                                onChange={(e) => updateCell(rowIndex, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, rowIndex)}
                                                placeholder="предложение"
                                            />
                                            {isDuplicate && (
                                                <i
                                                    className={`bi bi-exclamation-triangle-fill ${styles.duplicateCellIcon}`}
                                                    title="Повторяющееся значение"
                                                />
                                            )}
                                        </div>
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
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className={styles.findPairFooterHint}>
                Enter: следующая строка. Tab: переход между ячейками. Вставка из Excel добавляет предложения в конец
                таблицы.
            </div>

            {emptyRows.length > 0 && (
                <div className="alert alert-warning py-2 px-3 mt-2 mb-0" role="alert">
                    Есть незаполненные строки: {emptyRows.join(", ")}.
                </div>
            )}

            {duplicateList.length > 0 && (
                <div className="alert alert-warning py-2 px-3 mt-2 mb-0" role="alert">
                    Обнаружены повторы: {duplicateList.join("; ")}.
                </div>
            )}
        </div>
    );
};

export default TeacherAssessmentSentenceOrder;
