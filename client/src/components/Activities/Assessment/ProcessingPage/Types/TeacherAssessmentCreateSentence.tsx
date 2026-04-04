import React, { useLayoutEffect, useRef, useState } from "react";

import { TTeacherAssessmentCreateSentence } from "models/Activity/Items/TAssessmentItems";

import styles from "./Style.module.css";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";

const normalizeCell = (value: string | undefined): string => (value ?? "").trim();

const parseClipboardParts = (text: string): string[] =>
    text
        .split(/\r?\n/)
        .map((line) => line.split("\t")[0] ?? "")
        .map((cell) => cell.trim())
        .filter((cell) => cell !== "");

const TeacherAssessmentCreateSentence = ({
    data,
    taskUUID,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentCreateSentence>) => {
    const formRef = useRef<HTMLFormElement>(null);
    const focusPending = useRef<{ rowIndex: number; caretPosition?: number } | null>(null);
    const [focusVersion, setFocusVersion] = useState(0);

    const parts = data.meta_parts.length > 0 ? data.meta_parts : [""];

    useLayoutEffect(() => {
        if (!focusPending.current) {
            return;
        }

        const { rowIndex, caretPosition } = focusPending.current;
        focusPending.current = null;

        const input = formRef.current?.querySelector<HTMLInputElement>(`input[data-part-input='${rowIndex}']`);
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
    }, [parts.length, focusVersion]);

    const requestFocus = (rowIndex: number, caretPosition?: number, forceRender = false) => {
        focusPending.current = { rowIndex, caretPosition };
        if (forceRender) {
            setFocusVersion((value) => value + 1);
        }
    };

    const updateParts = (nextParts: string[]) => {
        onChangeTask({ ...data, meta_parts: nextParts });
    };

    const changePartHandler = (newValue: string, rowIndex: number) => {
        const nextParts = [...parts];
        nextParts[rowIndex] = newValue;
        updateParts(nextParts);
    };

    const addPart = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const nextParts = [...parts, ""];
        requestFocus(nextParts.length - 1);
        updateParts(nextParts);
    };

    const addPartAfter = (rowIndex: number) => {
        const nextParts = [...parts];
        nextParts.splice(rowIndex + 1, 0, "");
        requestFocus(rowIndex + 1);
        updateParts(nextParts);
    };

    const removePart = (rowIndex: number) => {
        const nextParts = parts.filter((_, i) => i !== rowIndex);
        updateParts(nextParts.length > 0 ? nextParts : [""]);
    };

    const splitPartByCaret = (rowIndex: number, start: number, end: number) => {
        const currentValue = parts[rowIndex] ?? "";
        const head = currentValue.slice(0, start);
        const tail = currentValue.slice(end);
        const nextParts = [...parts];
        nextParts[rowIndex] = head;
        nextParts.splice(rowIndex + 1, 0, tail);
        requestFocus(rowIndex + 1, 0);
        updateParts(nextParts);
    };

    const handlePartKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number) => {
        if (e.key === "Enter" && e.shiftKey) {
            e.preventDefault();
            const start = e.currentTarget.selectionStart ?? e.currentTarget.value.length;
            const end = e.currentTarget.selectionEnd ?? start;
            splitPartByCaret(rowIndex, start, end);
            return;
        }

        if (e.key === "Enter") {
            e.preventDefault();
            if (rowIndex === parts.length - 1) {
                addPartAfter(rowIndex);
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

        if (rowIndex < parts.length - 1) {
            requestFocus(rowIndex + 1, undefined, true);
        } else {
            addPartAfter(rowIndex);
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLFormElement>) => {
        const text = e.clipboardData.getData("text");
        if (!text.includes("\n") && !text.includes("\t")) {
            return;
        }

        const lines = parseClipboardParts(text);
        if (lines.length === 0) {
            return;
        }

        e.preventDefault();
        const nonEmptyParts = parts.filter((part) => normalizeCell(part) !== "");
        updateParts([...nonEmptyParts, ...lines]);
    };

    const counts = new Map<string, number>();
    parts.forEach((raw) => {
        const value = normalizeCell(raw);
        if (value === "") {
            return;
        }
        counts.set(value, (counts.get(value) ?? 0) + 1);
    });

    const duplicateSet = new Set(
        Array.from(counts.entries())
            .filter(([, count]) => count > 1)
            .map(([value]) => value),
    );

    return (
        <div className={styles.findPair}>
            <div className={styles.findPairHint}>Скопируйте столбец из Excel и вставьте его в части предложения.</div>
            <form ref={formRef} onPaste={handlePaste}>
                <div className={`table-responsive ${styles.findPairTableWrap}`}>
                    <table className={`table table-sm table-bordered align-middle mb-0 ${styles.findPairTable}`}>
                        <tbody>
                            {parts.map((part, i) => {
                                const normalizedPart = normalizeCell(part);
                                const isDuplicate = normalizedPart !== "" && duplicateSet.has(normalizedPart);

                                return (
                                    <tr key={`${taskUUID}_${i}`}>
                                        <td className={styles.sentenceOrderNumCell}>
                                            <span className={styles.sentenceOrderNum}>{i + 1}</span>
                                        </td>
                                        <td className="p-0">
                                            <div className={styles.duplicateCellWrap}>
                                                <input
                                                    type="text"
                                                    className={`form-control form-control-sm border-0 rounded-0 shadow-none ${
                                                        styles.findPairInput
                                                    } ${isDuplicate ? styles.duplicateCellInput : ""}`}
                                                    data-part-input={i}
                                                    value={part}
                                                    onChange={(e) => changePartHandler(e.target.value, i)}
                                                    onKeyDown={(e) => handlePartKeyDown(e, i)}
                                                    autoFocus={false}
                                                    placeholder="часть предложения"
                                                    style={{ background: "transparent" }}
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
                                                    onClick={() => removePart(i)}
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
                <button type="submit" className="btn btn-outline-dark btn-sm d-flex" onClick={addPart}>
                    <i className="bi bi-plus-lg" />
                    Добавить часть
                </button>
            </form>
        </div>
    );
};

export default TeacherAssessmentCreateSentence;
