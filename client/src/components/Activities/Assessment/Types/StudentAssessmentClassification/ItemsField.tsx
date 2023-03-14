import React from "react";
import DragItem from "./DragItem";
import { FieldProps } from "./DragAndDrop";
import { getDropToSpread } from "libs/DragAndDrop";

export interface ItemsFieldProps extends FieldProps {
    dragFields: string[];
    fieldName: "inputs" | "answers";
    answerColId: number;
    additionalClasses?: string;
}

const ItemsField = ({
    accept,
    dragFields,
    fieldName,
    answerColId,
    additionalClasses,
    onDropCallback,
}: ItemsFieldProps) => {
    return (
        <div
            {...getDropToSpread({
                accept,
                onDropCallback({ dragData }) {
                    onDropCallback({ from: dragData, to: { id: -1, colId: answerColId, name: fieldName } });
                    console.log(dragData);
                },
            })}
            style={{ backgroundColor: "#CCCCCC", minHeight: "10rem", padding: "20px" }}
            className={additionalClasses ? additionalClasses : ""}
        >
            {dragFields.map((text: string, fieldId: number) => (
                <DragItem
                    key={fieldId}
                    accept={accept}
                    fieldName={fieldName}
                    text={text}
                    fieldId={fieldId}
                    answerColId={answerColId}
                />
            ))}
        </div>
    );
};

export default ItemsField;
