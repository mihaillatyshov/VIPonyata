import React from "react";
import DragItem from "./DragItem";
import { FieldProps } from "./DragAndDrop";
import { getDropToSpread } from "libs/DragAndDrop";
import style from "../StyleAssessmentType.module.css";

export type AnswerFieldProps = FieldProps & {
    text: string | undefined | null;
    fieldId: number;
};

const AnswerField = ({ accept, text, fieldId, onDropCallback }: AnswerFieldProps) => {
    const getCN = () => {
        return `border border-primary ${style.s_fillSpaceExists}`;
    };
    return (
        <div
            {...getDropToSpread({
                accept,
                onDropCallback({ dragData }) {
                    onDropCallback({ from: dragData, to: { id: fieldId, name: "answers" } });
                    console.log(dragData);
                },
            })}
            className={getCN()}
        >
            {text !== undefined && text !== null ? (
                <DragItem accept={accept} fieldName="answers" text={text} fieldId={fieldId} />
            ) : (
                <div className="mx-2" style={{ width: "100px", height: "1.5rem" }}>
                    {" "}
                </div>
            )}
        </div>
    );
};

export default AnswerField;
