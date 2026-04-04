import React, { useLayoutEffect, useRef, useState } from "react";

import { ReactMarkdownWithHtml } from "components/Common/ReactMarkdownWithHtml";
import { FloatingLabelTextareaAutosize } from "components/Form/FloatingLabelTextareaAutosize";
import { TTeacherAssessmentTestMulti, TTeacherAssessmentTestSingle } from "models/Activity/Items/TAssessmentItems";

import styles from "./Style.module.css";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";

type TTeacherAssessmentTestType = TTeacherAssessmentTestSingle | TTeacherAssessmentTestMulti;

interface TeacherAssessmentTestBaseProps<T extends TTeacherAssessmentTestType> extends TeacherAssessmentTypeProps<T> {
    onRemoveOption: (id: number) => void;
    selectorNode: (id: number) => React.ReactNode;
}

const normalizeCell = (value: string | undefined): string => (value ?? "").trim();

const parseClipboardOptions = (text: string): string[] =>
    text
        .split(/\r?\n/)
        .map((line) => line.split("\t")[0] ?? "")
        .map((cell) => cell.trim())
        .filter((cell) => cell !== "");

const TeacherAssessmentTestBase = <T extends TTeacherAssessmentTestType>({
    data,
    taskUUID,
    onChangeTask,
    onRemoveOption,
    selectorNode,
}: TeacherAssessmentTestBaseProps<T>) => {
    const formRef = useRef<HTMLFormElement>(null);
    const focusPending = useRef<{ rowIndex: number; caretPosition?: number } | null>(null);
    const [focusVersion, setFocusVersion] = useState(0);

    useLayoutEffect(() => {
        if (!focusPending.current) {
            return;
        }

        const { rowIndex, caretPosition } = focusPending.current;
        focusPending.current = null;

        const input = formRef.current?.querySelector<HTMLInputElement>(`input[data-option-input='${rowIndex}']`);
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
    }, [data.options.length, focusVersion]);

    const requestFocus = (rowIndex: number, caretPosition?: number, forceRender = false) => {
        focusPending.current = { rowIndex, caretPosition };
        if (forceRender) {
            setFocusVersion((value) => value + 1);
        }
    };

    const changeQuestionHandler = (newValue: string) => onChangeTask({ ...data, question: newValue });

    const updateOptions = (options: string[]) => {
        onChangeTask({ ...data, options });
    };

    const addOption = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const nextOptions = [...data.options, ""];
        requestFocus(nextOptions.length - 1);
        updateOptions(nextOptions);
    };

    const changeOptionHandler = (newValue: string, id: number) => {
        const newOptions = [...data.options];
        newOptions[id] = newValue;
        updateOptions(newOptions);
    };

    const addOptionAfter = (rowIndex: number) => {
        const nextOptions = [...data.options];
        nextOptions.splice(rowIndex + 1, 0, "");
        requestFocus(rowIndex + 1);
        updateOptions(nextOptions);
    };

    const splitOptionByCaret = (rowIndex: number, start: number, end: number) => {
        const currentValue = data.options[rowIndex] ?? "";
        const head = currentValue.slice(0, start);
        const tail = currentValue.slice(end);
        const nextOptions = [...data.options];
        nextOptions[rowIndex] = head;
        nextOptions.splice(rowIndex + 1, 0, tail);
        requestFocus(rowIndex + 1, 0);
        updateOptions(nextOptions);
    };

    const handleOptionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number) => {
        if (e.key === "Enter" && e.shiftKey) {
            e.preventDefault();
            const start = e.currentTarget.selectionStart ?? e.currentTarget.value.length;
            const end = e.currentTarget.selectionEnd ?? start;
            splitOptionByCaret(rowIndex, start, end);
            return;
        }

        if (e.key === "Enter") {
            e.preventDefault();
            if (rowIndex === data.options.length - 1) {
                addOptionAfter(rowIndex);
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

        if (rowIndex < data.options.length - 1) {
            requestFocus(rowIndex + 1, undefined, true);
        } else {
            addOptionAfter(rowIndex);
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLFormElement>) => {
        const text = e.clipboardData.getData("text");
        if (!text.includes("\n") && !text.includes("\t")) {
            return;
        }

        const lines = parseClipboardOptions(text);
        if (lines.length === 0) {
            return;
        }

        e.preventDefault();
        const nonEmptyOptions = data.options.filter((option) => normalizeCell(option) !== "");
        updateOptions([...nonEmptyOptions, ...lines]);
    };

    return (
        <div className={styles.findPair}>
            <FloatingLabelTextareaAutosize
                htmlId={taskUUID}
                placeholder="Вопрос"
                value={data.question}
                onChangeHandler={changeQuestionHandler}
                rows={5}
                noErrorField={true}
            />
            <div className="mt-3 mb-2 md-last-pad-zero">
                <ReactMarkdownWithHtml>{data.question}</ReactMarkdownWithHtml>
            </div>
            <div className={styles.findPairHint}>Скопируйте столбец из Excel и вставьте его в варианты ответа.</div>
            <form ref={formRef} onPaste={handlePaste}>
                <div className={`table-responsive ${styles.findPairTableWrap}`}>
                    <table className={`table table-sm table-bordered align-middle mb-0 ${styles.findPairTable}`}>
                        <tbody>
                            {data.options.map((option, i) => (
                                <tr key={`${taskUUID}_${i}`}>
                                    <td className={styles.sentenceOrderNumCell}>
                                        <span className={styles.sentenceOrderNum}>{i + 1}</span>
                                    </td>
                                    <td className={styles.testSelectorCell}>{selectorNode(i)}</td>
                                    <td className="p-0">
                                        <input
                                            type="text"
                                            className={`form-control form-control-sm border-0 rounded-0 shadow-none ${styles.findPairInput}`}
                                            data-option-input={i}
                                            value={option}
                                            onChange={(e) => changeOptionHandler(e.target.value, i)}
                                            onKeyDown={(e) => handleOptionKeyDown(e, i)}
                                            autoFocus={false}
                                            placeholder="вариант ответа"
                                            style={{ background: "transparent" }}
                                        />
                                    </td>
                                    <td className={styles.findPairDeleteCell}>
                                        <div className="d-flex justify-content-center align-items-center h-100">
                                            <button
                                                className="btn btn-link p-0 text-danger"
                                                type="button"
                                                title="Удалить строку"
                                                onClick={() => onRemoveOption(i)}
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
                <button type="submit" className="btn btn-outline-dark btn-sm d-flex" onClick={addOption}>
                    <i className="bi bi-plus-lg" />
                    Добавить ответ
                </button>
            </form>
        </div>
    );
};

export default TeacherAssessmentTestBase;
