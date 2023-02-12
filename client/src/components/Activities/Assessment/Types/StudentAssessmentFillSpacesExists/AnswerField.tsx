import React from "react";
import DragItem from "./DragItem";
import { FieldProps } from "./DragAndDrop";
import { getDropToSpread } from "libs/DragAndDrop";

export type AnswerFieldProps = FieldProps & {
    text: string | undefined | null;
    fieldId: number;
    //taskId: number;
    // TODO Func to update fields
};

const AnswerField = ({ accept, text, fieldId, onDropCallback }: AnswerFieldProps) => {
    return (
        <div
            {...getDropToSpread({
                accept: "testDND",
                onDropCallback: (dragData) => {
                    onDropCallback({ from: dragData, to: { id: fieldId, name: "answers" } });
                    console.log(dragData);
                },
            })}
            style={{ backgroundColor: "#228823", width: "min-content", borderRadius: "1000px 1000px 1000px 1000px" }}
        >
            {text !== undefined && text !== null ? (
                <DragItem accept={accept} fieldName="answers" text={text} fieldId={fieldId} />
            ) : (
                <div className="mx-2" style={{ width: "100px", height: "4em" }}>
                    {" "}
                </div>
            )}
        </div>
    );
};

export default AnswerField;
