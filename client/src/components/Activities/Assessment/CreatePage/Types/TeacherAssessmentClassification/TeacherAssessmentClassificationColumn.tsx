import React from "react";

import styles from "../Style.module.css";

interface TitleProps {
    value: string;
    colId: number;
    onChange: (value: string, colId: number) => void;
}

const Title = ({ value, colId, onChange }: TitleProps) => {
    const htmlId = `${colId}`;
    const placeholder = "Название";
    return (
        <div className="form-floating mb-3">
            <input
                type="text"
                value={value}
                className="form-control"
                id={htmlId}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value, colId)}
                autoFocus={true}
            />
            <label htmlFor={htmlId}>{placeholder}</label>
        </div>
    );
};

interface CellProps {
    field: string;
    colId: number;
    rowId: number;
    onAnswerChange: (value: string, colId: number, rowId: number) => void;
    removeRow: (colId: number, rowId: number) => void;
}

const Cell = ({ field, colId, rowId, onAnswerChange, removeRow }: CellProps) => {
    return (
        <div className="input-group mb-3 w-auto mb-2">
            <input
                type="text"
                className="form-control"
                value={field}
                onChange={(e) => onAnswerChange(e.target.value, colId, rowId)}
                autoFocus={true}
            />
            <span className="input-group-text w-auto p-0">
                <i
                    className="bi bi-x font-icon-height-0 font-icon-button-danger"
                    style={{ fontSize: "2em", margin: "0 2px" }}
                    onClick={() => removeRow(colId, rowId)}
                />
            </span>
        </div>
    );
};

interface TeacherAssessmentClassificationColumnProps {
    title: string;
    colId: number;
    fields: string[];
    onTitleChange: (value: string, colId: number) => void;
    onAnswerChange: (value: string, colId: number, rowId: number) => void;
    addRow: (colId: number) => void;
    removeCol: (colId: number) => void;
    removeRow: (colId: number, rowId: number) => void;
}

const TeacherAssessmentClassificationColumn = ({
    title,
    colId,
    fields,
    onTitleChange,
    onAnswerChange,
    addRow,
    removeCol,
    removeRow,
}: TeacherAssessmentClassificationColumnProps) => {
    const addRawHandler = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        addRow(colId);
    };

    return (
        <div className="col">
            <div className={`${styles.classificationCol} d-flex flex-column`}>
                <div className="d-flex justify-content-center align-items-center">
                    <Title value={title} colId={colId} onChange={onTitleChange} />
                    <div className="ms-auto mb-3">
                        <i
                            className="bi bi-x font-icon-height-0 font-icon-button-danger"
                            style={{ fontSize: "2.8em" }}
                            onClick={() => removeCol(colId)}
                        />
                    </div>
                </div>
                <form>
                    <div className="flex-grow-1">
                        {fields.map((field, i) => (
                            <Cell
                                key={i}
                                field={field}
                                colId={colId}
                                rowId={i}
                                onAnswerChange={onAnswerChange}
                                removeRow={removeRow}
                            />
                        ))}
                    </div>

                    <div className="d-flex justify-content-center mt-3">
                        <button className="btn btn-outline-dark btn-sm d-flex" onClick={addRawHandler}>
                            <i className="bi bi-plus-lg" />
                            Добавить строку
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TeacherAssessmentClassificationColumn;
