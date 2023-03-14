import React, { useState } from "react";
import { FieldName, SingleSwapDataProps } from "./DragAndDrop";
import { getDragToSpread } from "libs/DragAndDrop";

export type DropFieldProps = {
    accept: string;
    fieldName: FieldName;
    text: string;
    fieldId: number;
    answerColId: number;
};

const DragItem = ({ accept, fieldName, text, fieldId, answerColId }: DropFieldProps) => {
    const [opacity, setOpacity] = useState(1);

    return (
        <div
            {...getDragToSpread({
                accept,
                onDragStartCallback: ({ setDataCallback }) => {
                    setOpacity(0.5);
                    const callbackData: SingleSwapDataProps = { name: fieldName, id: fieldId, colId: answerColId };
                    setDataCallback(callbackData);
                },
                //onDragLeaveCallback: () => setOpacityDebug(1),
                onDragEndCallback: () => setOpacity(1),
            })}
            className="d-inline-flex mx-2"
            style={{
                opacity: opacity,
                fontWeight: "bold",
                cursor: "move",
                borderRadius: "1000px 1000px 1000px 1000px",
            }}
        >
            {text}
        </div>
    );
};

export default DragItem;
