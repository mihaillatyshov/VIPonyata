import React from "react";
import { TTeacherAssessmentFindPair } from "models/Activity/Items/TAssessmentItems";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";

import styles from "./Style.module.css";

type TColNames = "meta_first" | "meta_second";

const zip = (meta_first: string[], meta_second: string[]): string[][] => {
    return meta_first.map((el, i) => [el, meta_second[i]]);
};

interface CellProps {
    value: string;
    colName: TColNames;
    rowId: number;
    onChange: (newValue: string, colName: TColNames, rowId: number) => void;
}

const Cell = ({ value, colName, rowId, onChange }: CellProps) => {
    return (
        <div className="col-5">
            <div className="d-flex justify-content-center">
                <input
                    type="text"
                    className="form-control"
                    value={value}
                    onChange={(e) => onChange(e.target.value, colName, rowId)}
                    autoFocus={colName === "meta_first"}
                />
            </div>
        </div>
    );
};

const TeacherAssessmentFindPair = ({
    data,
    taskUUID,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentFindPair>) => {
    const onTextChangeHandler = (newValue: string, colName: TColNames, rowId: number) => {
        const newCol = data[colName];
        newCol[rowId] = newValue;
        onChangeTask({ ...data, [colName]: newCol });
    };

    const addLine = () => {
        onChangeTask({ ...data, meta_first: [...data.meta_first, ""], meta_second: [...data.meta_second, ""] });
    };

    const removeLine = (rowId: number) => {
        const newFirst = [...data.meta_first];
        const newSecond = [...data.meta_second];
        newFirst.splice(rowId, 1);
        newSecond.splice(rowId, 1);
        onChangeTask({ ...data, meta_first: newFirst, meta_second: newSecond });
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

            {zip(data.meta_first, data.meta_second).map(([meta_first, meta_second], i) => (
                <div key={i} className={`row ${styles.tableRow}`}>
                    <Cell colName="meta_first" value={meta_first} rowId={i} onChange={onTextChangeHandler} />
                    <div className="col-2 jus">
                        <div className="d-flex justify-content-center">
                            <i
                                className="bi bi-x font-icon-height-0 font-icon-button-danger"
                                style={{ fontSize: "2.3em" }}
                                onClick={() => removeLine(i)}
                            />
                        </div>
                    </div>
                    <Cell colName="meta_second" value={meta_second} rowId={i} onChange={onTextChangeHandler} />
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
