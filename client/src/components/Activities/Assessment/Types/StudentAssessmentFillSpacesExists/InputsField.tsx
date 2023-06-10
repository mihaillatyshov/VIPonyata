import React from "react";
import DragItem from "./DragItem";
import { FieldProps } from "./DragAndDrop";
import { getDropToSpread } from "libs/DragAndDrop";

export interface InputsFieldProps extends FieldProps {
    inputFields: string[];
}

const InputsField = ({ accept, inputFields, onDropCallback }: InputsFieldProps) => {
    return (
        <div>
            <div
                {...getDropToSpread({
                    accept,
                    onDropCallback({ dragData }) {
                        onDropCallback({ from: dragData, to: { id: -1, name: "inputs" } });
                        console.log(dragData);
                    },
                })}
                style={{ backgroundColor: "#CCCCCC", minHeight: "10rem", padding: "20px" }}
            >
                {inputFields.map((text: string, fieldId: number) => (
                    <DragItem key={fieldId} accept={accept} fieldName="inputs" text={text} fieldId={fieldId} />
                ))}
            </div>
        </div>
    );
};

export default InputsField;
