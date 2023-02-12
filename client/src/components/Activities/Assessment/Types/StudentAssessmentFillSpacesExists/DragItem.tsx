import React, { useState } from "react";
import { FieldName } from "./DragAndDrop";
import { getDragToSpread } from "libs/DragAndDrop";

export type DropFieldProps = {
    accept: string;
    fieldName: FieldName;
    text: string;
    fieldId: any | undefined;
};

const DragItem = ({ accept, fieldName, text, fieldId }: DropFieldProps) => {
    const [opacity, setOpacity] = useState(1);

    return (
        <div
            {...getDragToSpread({
                accept: "testDND",
                data: { name: fieldName, id: fieldId },
                onDragStartCallback: () => setOpacity(0.5),
                onDragEndCallback: () => setOpacity(1),
            })}
            className="d-inline-flex"
            style={{
                opacity: opacity,
                fontSize: 25,
                fontWeight: "bold",
                cursor: "move",
                padding: "10px",
                backgroundColor: "#662244",
                borderRadius: "1000px 1000px 1000px 1000px",
            }}
        >
            {text}
        </div>
    );
};

export default DragItem;
