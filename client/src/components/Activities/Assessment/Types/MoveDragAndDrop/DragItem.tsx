import React from "react";

import { getDragToSpread } from "libs/DragAndDrop";

type FieldIdType = number | undefined;
type SetFieldIdFuncType = (fieldId: FieldIdType) => void;

interface DragItemProps {
    id: number;
    text?: string;
    accept: string;
    fakeFieldId: FieldIdType;
    setFakeFieldId: SetFieldIdFuncType;
    selectedFieldId: FieldIdType;
    setSelectedFieldId: SetFieldIdFuncType;
    updateFields: () => void;
    selectedFieldText: string | undefined;
}

const DragItem = ({
    id,
    text,
    accept,
    fakeFieldId,
    setFakeFieldId,
    selectedFieldId,
    setSelectedFieldId,
    updateFields,
    selectedFieldText,
}: DragItemProps) => {
    const getClassName = () => {
        return `d-inline-flex mx-2 text-nowrap 
        ${text ? "" : "border border-primary"} 
        ${selectedFieldId === id && fakeFieldId !== undefined ? "d-none" : "d-inline-flex"}`;
    };

    return (
        <>
            {fakeFieldId === id && <div className="text-nowrap mx-2"> {selectedFieldText} </div>}
            <div
                {...getDragToSpread({
                    accept,
                    onDragStartCallback: ({ setDataCallback }) => {
                        setSelectedFieldId(id);
                        setDataCallback({});
                    },
                    onDragOverCallback: () => {
                        setFakeFieldId(selectedFieldId === id ? undefined : id);
                    },
                    //onDragLeaveCallback: () => setOpacityDebug(1),
                    onDragEndCallback: () => {
                        updateFields();
                    },
                })}
                className={getClassName()}
                style={{
                    minHeight: "1rem",
                    width: "100%",
                    minWidth: "20px",
                    textDecoration: `${selectedFieldId === id && fakeFieldId !== undefined ? "line-through" : ""}`,
                }}
            >
                {text}
            </div>
        </>
    );
};

export default DragItem;
