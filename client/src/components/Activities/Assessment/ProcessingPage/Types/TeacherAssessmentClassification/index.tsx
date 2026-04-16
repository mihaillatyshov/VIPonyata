import React, { useLayoutEffect, useRef, useState } from "react";

import { TTeacherAssessmentClassification } from "models/Activity/Items/TAssessmentItems";

import styles from "../Style.module.css";
import { TeacherAssessmentTypeProps } from "../TeacherAssessmentTypeBase";

const makeEmptyColumn = (rowsCount: number): string[] => Array.from({ length: rowsCount }, () => "");

const getRowsCount = (answers: string[][]): number => {
    const maxRows = answers.reduce((max, column) => Math.max(max, column.length), 0);
    return maxRows === 0 ? 1 : maxRows;
};

const parseClipboardRows = (text: string): string[][] =>
    text
        .split(/\r?\n/)
        .map((line) => line.split("\t").map((cell) => cell.trim()))
        .filter((row) => row.some((cell) => cell !== ""));

const normalizeCell = (value: string | undefined): string => (value ?? "").trim();

const TeacherAssessmentClassification = ({
    data,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentClassification>) => {
    const tableRef = useRef<HTMLTableElement>(null);
    const focusPending = useRef<{ rowIndex: number; colIndex: number } | null>(null);
    const [focusVersion, setFocusVersion] = useState(0);
    const rowsCount = getRowsCount(data.meta_answers);
    const colsCount = data.titles.length;
    const incompleteRows = Array.from({ length: rowsCount }, (_, rowIndex) => {
        const hasEmptyCell = Array.from(
            { length: colsCount },
            (_, colIndex) => normalizeCell(data.meta_answers[colIndex]?.[rowIndex]) === "",
        ).some(Boolean);
        return hasEmptyCell ? rowIndex + 1 : null;
    }).filter((row): row is number => row !== null);

    const duplicateValuesByColumn = data.titles.map((_, colIndex) => {
        const counts = new Map<string, number>();
        data.meta_answers[colIndex]?.forEach((rawValue) => {
            const value = normalizeCell(rawValue);
            if (value === "") {
                return;
            }
            counts.set(value, (counts.get(value) ?? 0) + 1);
        });

        return new Set(
            Array.from(counts.entries())
                .filter(([, count]) => count > 1)
                .map(([value]) => value),
        );
    });

    const duplicateWarnings = duplicateValuesByColumn
        .map((duplicates, colIndex) => {
            if (duplicates.size === 0) {
                return null;
            }

            const columnLabel =
                data.titles[colIndex]?.trim() !== "" ? data.titles[colIndex] : `Колонка ${colIndex + 1}`;
            return `${columnLabel}: ${Array.from(duplicates).join(", ")}`;
        })
        .filter((warning): warning is string => warning !== null);

    useLayoutEffect(() => {
        if (!focusPending.current) {
            return;
        }

        const { rowIndex, colIndex } = focusPending.current;
        focusPending.current = null;

        const tbody = tableRef.current?.querySelector("tbody");
        if (!tbody) {
            return;
        }

        const input = tbody.rows[rowIndex]?.cells[colIndex]?.querySelector<HTMLInputElement>("input");
        input?.focus();
        input?.select();
    }, [rowsCount, colsCount, focusVersion]);

    const requestFocus = (rowIndex: number, colIndex: number, forceRender = false) => {
        focusPending.current = { rowIndex, colIndex };
        if (forceRender) {
            setFocusVersion((value) => value + 1);
        }
    };

    const updateTask = (titles: string[], meta_answers: string[][]) => {
        onChangeTask({ ...data, titles, meta_answers });
    };

    const addColumn = () => {
        updateTask([...data.titles, ""], [...data.meta_answers, makeEmptyColumn(rowsCount)]);
    };

    const onTitleChangeHandler = (newValue: string, colId: number) => {
        const newTitles = [...data.titles];
        newTitles.splice(colId, 1, newValue);
        updateTask(newTitles, [...data.meta_answers]);
    };

    const onAnswerChangeHandler = (newValue: string, colId: number, rowId: number) => {
        const newAnswers = data.meta_answers.map((column, index) => {
            if (index !== colId) {
                return [...column];
            }

            const nextColumn = [...column];
            while (nextColumn.length <= rowId) {
                nextColumn.push("");
            }
            nextColumn.splice(rowId, 1, newValue);
            return nextColumn;
        });
        updateTask([...data.titles], newAnswers);
    };

    const addRow = () => {
        const newAnswers = data.meta_answers.map((column) => [...column, ""]);
        updateTask([...data.titles], newAnswers);
    };

    const addRowWithFocus = (baseRowIndex: number) => {
        requestFocus(baseRowIndex + 1, 0);
        addRow();
    };

    const removeCol = (colId: number) => {
        const newTitles = [...data.titles];
        const newAnswers = [...data.meta_answers];
        newTitles.splice(colId, 1);
        newAnswers.splice(colId, 1);
        updateTask(newTitles, newAnswers);
    };

    const removeRow = (rowId: number) => {
        const newAnswers = data.meta_answers.map((column) => column.filter((_, index) => index !== rowId));
        updateTask([...data.titles], newAnswers);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTableElement>) => {
        const text = e.clipboardData.getData("text");
        if (!text.includes("\t") && !text.includes("\n")) {
            return;
        }

        const pastedRows = parseClipboardRows(text);
        if (pastedRows.length === 0) {
            return;
        }

        e.preventDefault();

        const pastedColsCount = Math.max(...pastedRows.map((row) => row.length));
        const colsCount = Math.max(data.titles.length, data.meta_answers.length, pastedColsCount);
        const nextTitles = [...data.titles];
        const nextAnswers = Array.from({ length: colsCount }, (_, colIndex) => {
            const existingColumn = data.meta_answers[colIndex] ?? [];
            return [...existingColumn];
        });

        while (nextTitles.length < colsCount) {
            nextTitles.push("");
        }

        pastedRows.forEach((row) => {
            for (let colIndex = 0; colIndex < colsCount; colIndex++) {
                nextAnswers[colIndex].push((row[colIndex] ?? "").trim());
            }
        });

        updateTask(nextTitles, nextAnswers);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
        if (e.key === "Enter") {
            e.preventDefault();

            if (rowIndex === rowsCount - 1) {
                addRowWithFocus(rowIndex);
            } else {
                requestFocus(rowIndex + 1, 0, true);
            }
            return;
        }

        if (e.key !== "Tab") {
            return;
        }

        const nextCol = colIndex + (e.shiftKey ? -1 : 1);

        if (nextCol >= 0 && nextCol < colsCount) {
            e.preventDefault();
            requestFocus(rowIndex, nextCol, true);
            return;
        }

        if (!e.shiftKey && nextCol >= colsCount) {
            e.preventDefault();
            if (rowIndex < rowsCount - 1) {
                requestFocus(rowIndex + 1, 0, true);
            } else {
                addRowWithFocus(rowIndex);
            }
            return;
        }

        if (e.shiftKey && nextCol < 0 && rowIndex > 0) {
            e.preventDefault();
            requestFocus(rowIndex - 1, colsCount - 1, true);
        }
    };

    return (
        <div className={styles.classificationTableEditor}>
            <div className={styles.findPairActions}>
                <button className="btn btn-outline-dark btn-sm d-flex" type="button" onClick={addColumn}>
                    <i className="bi bi-plus-lg" />
                    Добавить колонку
                </button>
                <div className={styles.findPairHint}>
                    Скопируйте диапазон из Excel и вставьте его прямо в таблицу. Данные добавятся в конец.
                </div>
            </div>

            {data.titles.length === 0 ? (
                <div className={styles.findPairFooterHint}>Добавьте хотя бы одну колонку.</div>
            ) : (
                <div className={`table-responsive ${styles.findPairTableWrap}`}>
                    <table
                        ref={tableRef}
                        className={`table table-sm table-bordered align-middle mb-0 ${styles.findPairTable}`}
                        onPaste={handlePaste}
                    >
                        <thead>
                            <tr>
                                {data.titles.map((title, colId) => (
                                    <th key={`title_${colId}`} className={styles.findPairTableHead}>
                                        <div className="d-flex align-items-center gap-2">
                                            <input
                                                type="text"
                                                className={`form-control form-control-sm ${styles.classificationTitleInput}`}
                                                placeholder={`Колонка ${colId + 1}`}
                                                value={title}
                                                onChange={(e) => onTitleChangeHandler(e.target.value, colId)}
                                            />
                                            <button
                                                className="btn btn-link p-0 text-danger"
                                                type="button"
                                                title="Удалить колонку"
                                                onClick={() => removeCol(colId)}
                                            >
                                                <i className="bi bi-x-lg" />
                                            </button>
                                        </div>
                                    </th>
                                ))}
                                <th className={styles.findPairDeleteHead}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: rowsCount }, (_, rowId) => (
                                <tr key={`row_${rowId}`}>
                                    {data.titles.map((_, colId) => {
                                        const cellValue = data.meta_answers[colId]?.[rowId] ?? "";
                                        const normalizedValue = normalizeCell(cellValue);
                                        const isDuplicate =
                                            normalizedValue !== "" &&
                                            duplicateValuesByColumn[colId]?.has(normalizedValue);

                                        return (
                                            <td key={`cell_${rowId}_${colId}`} className="p-0">
                                                <div className={styles.duplicateCellWrap}>
                                                    <input
                                                        type="text"
                                                        className={`form-control form-control-sm border-0 rounded-0 shadow-none ${
                                                            styles.findPairInput
                                                        } ${isDuplicate ? styles.duplicateCellInput : ""}`}
                                                        style={{ background: "transparent" }}
                                                        value={cellValue}
                                                        onChange={(e) =>
                                                            onAnswerChangeHandler(e.target.value, colId, rowId)
                                                        }
                                                        onKeyDown={(e) => handleKeyDown(e, rowId, colId)}
                                                        placeholder="слово"
                                                    />
                                                    {isDuplicate && (
                                                        <i
                                                            className={`bi bi-exclamation-triangle-fill ${styles.duplicateCellIcon}`}
                                                            title="Повторяющееся значение"
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className={styles.findPairDeleteCell}>
                                        <div className="d-flex justify-content-center align-items-center h-100">
                                            <button
                                                className="btn btn-link p-0 text-danger"
                                                type="button"
                                                title="Удалить строку"
                                                onClick={() => removeRow(rowId)}
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
            )}

            <div className={styles.findPairFooterHint}>
                Enter: следующая строка. Tab: переход между ячейками. Вставка из Excel добавляет пары в конец таблицы.
            </div>

            {incompleteRows.length > 0 && (
                <div className="alert alert-info py-2 px-3 mt-2 mb-0" role="alert">
                    Есть незаполненные строки: {incompleteRows.join(", ")}. Это не мешает сохранению, пустые ячейки
                    будут проигнорированы.
                </div>
            )}

            {duplicateWarnings.length > 0 && (
                <div className="alert alert-warning py-2 px-3 mt-2 mb-0" role="alert">
                    Обнаружены повторы: {duplicateWarnings.join("; ")}.
                </div>
            )}
        </div>
    );
};

export default TeacherAssessmentClassification;
