import React from "react";
import { TAssessmentFindPair } from "models/Activity/Items/TAssessmentItems";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";

import styles from "./Style.module.css";

type TColNames = "first" | "second";
type TInputEvent = React.ChangeEvent<HTMLInputElement>;

const zip = (first: string[], second: string[]): string[][] => {
    return first.map((el, i) => [el, second[i]]);
};

interface CellProps {
    value: string;
    colName: TColNames;
    rowId: number;
    onChange: (e: TInputEvent, colName: TColNames, rowId: number) => void;
}

const Cell = ({ value, colName, rowId, onChange }: CellProps) => {
    return (
        <div className="col-5">
            <div className="d-flex justify-content-center">
                <input
                    type="text"
                    className="form-control"
                    value={value}
                    onChange={(e) => onChange(e, colName, rowId)}
                />
            </div>
        </div>
    );
};

const TeacherAssessmentFindPair = ({ data, taskId, onChangeTask }: TeacherAssessmentTypeProps<TAssessmentFindPair>) => {
    const onTextChangeHandler = (e: TInputEvent, colName: TColNames, rowId: number) => {
        const newCol = data[colName];
        newCol[rowId] = e.target.value;
        onChangeTask(taskId, { ...data, [colName]: newCol });
    };

    const addLine = () => {
        onChangeTask(taskId, { ...data, first: [...data.first, ""], second: [...data.second, ""] });
    };

    const removeLine = (rowId: number) => {
        const newFirst = [...data.first];
        const newSecond = [...data.second];
        newFirst.splice(rowId, 1);
        newSecond.splice(rowId, 1);
        onChangeTask(taskId, { ...data, first: newFirst, second: newSecond });
    };

    return (
        <div className={styles.findPair}>
            <div className={`row ${styles.tableHeader}`}>
                <div className="col-5">
                    <div className="d-flex justify-content-center">Первый столбец</div>
                </div>
                <div className="col-2"></div>
                <div className="col-5">
                    <div className="d-flex justify-content-center">Второй столбец</div>
                </div>
            </div>

            {zip(data.first, data.second).map(([first, second], i) => (
                <div key={i} className={`row ${styles.tableRow}`}>
                    <Cell colName="first" value={first} rowId={i} onChange={onTextChangeHandler} />
                    <div className="col-2 jus">
                        <div className="d-flex justify-content-center">
                            <i
                                className="bi bi-x font-icon-height-0 font-icon-button-danger"
                                style={{ fontSize: "2.3em" }}
                                onClick={() => removeLine(i)}
                            />
                        </div>
                    </div>
                    <Cell colName="second" value={second} rowId={i} onChange={onTextChangeHandler} />
                </div>
            ))}

            <div className="d-flex justify-content-center mt-3">
                <button className="btn btn-outline-dark btn-sm d-flex" onClick={addLine}>
                    <i className="bi bi-plus-lg" />
                    Добавить строку
                </button>
            </div>
        </div>
    );
};

export default TeacherAssessmentFindPair;
