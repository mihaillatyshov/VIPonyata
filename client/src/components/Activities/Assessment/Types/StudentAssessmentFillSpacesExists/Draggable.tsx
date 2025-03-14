import React from "react";

import CSS from "csstype";
import AutosizeDiv from "libs/AutosizeDiv";

import { useDraggable } from "@dnd-kit/core";
import { CSS as DNDCSS } from "@dnd-kit/utilities";

export type DraggableType = "answer" | "inputs";

export interface FieldData {
    fieldId: number;
    type: DraggableType;
}

export const isFieldData = (data: any): data is FieldData => data !== undefined;

interface DraggableProps {
    id: number;
    str: string;
    longestStr: string;
    type: DraggableType;
}

const Draggable = ({ id, str, longestStr, type }: DraggableProps) => {
    const data: FieldData = { fieldId: id, type };
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `${str}_${id}`,
        data,
    });

    const style: CSS.Properties = {
        transform: DNDCSS.Translate.toString(transform),
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="d-flex dnd__sortable-item">
            <AutosizeDiv
                value={str}
                valueToCalcSize={longestStr}
                inputClassName="prevent-select text-center text-nowrap"
            />
        </div>
    );
};

export default Draggable;
