import React from "react";
import { TAssessmentFillSpacesExists } from "models/Activity/Items/TAssessmentItems";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";
import { getTextWidth } from "libs/fontSize";
import CSS from "csstype";

import styles from "./Style.module.css";

type TItemNames = "separates" | "answers";
type TInputEvent = React.ChangeEvent<HTMLInputElement>;

interface InputProps {
    value: string;
    colName: TItemNames;
    id: number;
    isSingle: boolean;
    onChange: (e: TInputEvent, colName: TItemNames, id: number) => void;
}

const Input = ({ value, colName, id, isSingle, onChange }: InputProps) => {
    const htmlId = `${colName}_${id}`;
    const placeholder = colName === "separates" ? "Текст" : "Пропуск";
    const size = Math.max(value.length * 1.5, 6);
    const textWidth = Math.max(
        100,
        getTextWidth(
            value,
            `bold 1rem arial system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue","Noto Sans","Liberation Sans",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"`
        ) + 50
    );
    console.log("texWidth", value, textWidth);
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
                size={size}
                className="form-control"
                id={htmlId}
                placeholder={placeholder}
                onChange={(e) => onChange(e, colName, id)}
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
            <button type="button" className="btn btn-outline-dark btn-lg h-100 py-0 px-2" onClick={() => addBlock(id)}>
                <i className="bi bi-plus-lg" style={{ fontSize: "1.8em" }} />
            </button>
        </div>
    );
};

const TeacherAssessmentFillSpacesExists = ({
    data,
    taskId,
    onChangeTask,
}: TeacherAssessmentTypeProps<TAssessmentFillSpacesExists>) => {
    const onTextChangeHandler = (e: TInputEvent, colName: TItemNames, rowId: number) => {
        const newCol = data[colName];
        newCol[rowId] = e.target.value;
        onChangeTask(taskId, { ...data, [colName]: newCol });
    };

    const addBlock = (id: number) => {
        const newSeparates = data.separates;
        const newAnswers = data.answers;
        newSeparates.splice(id, 0, "");
        newAnswers.splice(id, 0, "");
        onChangeTask(taskId, { ...data, separates: newSeparates, answers: newAnswers });
    };

    const removeBlock = (id: number) => {
        const newSeparates = data.separates;
        const newAnswers = data.answers;
        newSeparates.splice(id, 1);
        newAnswers.splice(id, 1);
        onChangeTask(taskId, { ...data, separates: newSeparates, answers: newAnswers });
    };

    return (
        <div>
            <div className="d-flex flex-wrap">
                {data.answers.map((answer, i) => (
                    <>
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
                                colName="answers"
                                id={i}
                                isSingle={false}
                                onChange={onTextChangeHandler}
                            />
                            <span className="input-group-text w-auto" id="basic-addon1">
                                <i
                                    className="bi bi-x font-icon-height-0 font-icon-button-danger"
                                    style={{ fontSize: "2.2em" }}
                                    onClick={() => removeBlock(i)}
                                />
                            </span>
                        </div>
                    </>
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
                    {data.answers.map((answer, i) => (
                        <>
                            <div className="me-2">{data.separates[i]}</div>
                            <div className={`${styles.fillSpacesResultAnswer} me-2`}>{answer} </div>
                        </>
                    ))}
                    <div className="me-1">{data.separates.at(-1)}</div>
                </div>
            </div>
        </div>
    );
};

export default TeacherAssessmentFillSpacesExists;
