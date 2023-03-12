import React from "react";
import DragItem from "./DragItem";
import { FieldProps } from "./DragAndDrop";
import { getDropToSpread } from "libs/DragAndDrop";

export type InputsFieldProps = FieldProps & {
    inputFields: any[string];
};

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
                style={{ backgroundColor: "#CCCCCC", minHeight: "100px" }}
            >
                {inputFields.map((text: string, fieldId: number) => (
                    <DragItem key={fieldId} accept={accept} fieldName="inputs" text={text} fieldId={fieldId} />
                ))}
            </div>
        </div>
    );
};

export default InputsField;
