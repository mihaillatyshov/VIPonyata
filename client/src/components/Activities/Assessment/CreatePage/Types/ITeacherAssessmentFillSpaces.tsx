import React from "react";
import {
    TTeacherAssessmentFillSpacesByHand,
    TTeacherAssessmentFillSpacesExists,
} from "models/Activity/Items/TAssessmentItems";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";
import { getTextWidth } from "libs/fontSize";
import CSS from "csstype";

import styles from "./Style.module.css";

type TItemNames = "separates" | "meta_answers";
type TTeacherAssessmentFillSpaceType = TTeacherAssessmentFillSpacesExists | TTeacherAssessmentFillSpacesByHand;

interface InputProps {
    value: string;
    colName: TItemNames;
    id: number;
    isSingle: boolean;
    onChange: (newValue: string, colName: TItemNames, id: number) => void;
}

const Input = ({ value, colName, id, isSingle, onChange }: InputProps) => {
    const htmlId = `${colName}_${id}`;
    const placeholder = colName === "separates" ? "Текст" : "Пропуск";
    const textWidth = Math.max(
        100,
        getTextWidth(
            value,
            `bold 1rem arial system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue","Noto Sans","Liberation Sans",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"`
        ) + 50
    );
    const className = `form-floating px-0 ${isSingle ? "me-3 mb-3" : "mx-0"}`;
    const style: CSS.Properties = {
        minWidth: `${textWidth}px`,
        maxWidth: `${textWidth}px`,
    };
    return (
        <div className={className} style={style}>
            <input
                type="text"
                value={value}
                className="form-control"
                id={htmlId}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value, colName, id)}
                autoFocus={colName === "separates"}
            />
            <label htmlFor={htmlId}>{placeholder}</label>
        </div>
    );
};

interface AddBlockButtonProps {
    id: number;
    addBlock: (id: number) => void;
}
const AddBlockButton = ({ id, addBlock }: AddBlockButtonProps) => {
    return (
        <div className="mb-3 me-3">
            <button type="button" className="btn btn-outline-dark btn-lg h-100 p-0" onClick={() => addBlock(id)}>
                <i className="bi bi-plus-lg" style={{ fontSize: "1.8em", margin: "0 10px" }} />
            </button>
        </div>
    );
};

const ITeacherAssessmentFillSpaces = <T extends TTeacherAssessmentFillSpaceType>({
    data,
    taskId,
    onChangeTask,
}: TeacherAssessmentTypeProps<T>) => {
    const onTextChangeHandler = (newValue: string, colName: TItemNames, rowId: number) => {
        const newCol = data[colName];
        newCol[rowId] = newValue;
        onChangeTask(taskId, { ...data, [colName]: newCol });
    };

    const addBlock = (id: number) => {
        const newSeparates = data.separates;
        const newAnswers = data.meta_answers;
        newSeparates.splice(id, 0, "");
        newAnswers.splice(id, 0, "");
        onChangeTask(taskId, { ...data, separates: newSeparates, meta_answers: newAnswers });
    };

    const removeBlock = (id: number) => {
        const newSeparates = data.separates;
        const newAnswers = data.meta_answers;
        newSeparates.splice(id, 1);
        newAnswers.splice(id, 1);
        onChangeTask(taskId, { ...data, separates: newSeparates, meta_answers: newAnswers });
    };

    return (
        <div>
            <div className="d-flex flex-wrap">
                {data.meta_answers.map((answer, i) => (
                    <React.Fragment key={i}>
                        <AddBlockButton id={i} addBlock={addBlock} />

                        <div key={i} className="input-group mb-3 me-3 w-auto">
                            <Input
                                value={data.separates[i]}
                                colName="separates"
                                id={i}
                                isSingle={false}
                                onChange={onTextChangeHandler}
                            />
                            <Input
                                value={answer ?? ""}
                                colName="meta_answers"
                                id={i}
                                isSingle={false}
                                onChange={onTextChangeHandler}
                            />
                            <span className="input-group-text w-auto p-0">
                                <i
                                    className="bi bi-x font-icon-height-0 font-icon-button-danger"
                                    style={{ fontSize: "2.5em", margin: "0 8px" }}
                                    onClick={() => removeBlock(i)}
                                />
                            </span>
                        </div>
                    </React.Fragment>
                ))}
                <AddBlockButton id={data.separates.length - 1} addBlock={addBlock} />
                <Input
                    value={data.separates.at(-1) ?? ""}
                    colName="separates"
                    id={data.separates.length - 1}
                    isSingle={true}
                    onChange={onTextChangeHandler}
                />
                <AddBlockButton id={data.separates.length} addBlock={addBlock} />
            </div>
            <div>
                <div>Результат: </div>
                <div className="d-flex">
                    &nbsp;
                    {data.meta_answers.map((answer, i) => (
                        <React.Fragment key={i}>
                            <div className="me-2">{data.separates[i]}</div>
                            <div className={`${styles.fillSpacesResultAnswer} me-2`}>{answer} </div>
                        </React.Fragment>
                    ))}
                    <div className="me-1">{data.separates.at(-1)}</div>
                </div>
            </div>
        </div>
    );
};

export default ITeacherAssessmentFillSpaces;
