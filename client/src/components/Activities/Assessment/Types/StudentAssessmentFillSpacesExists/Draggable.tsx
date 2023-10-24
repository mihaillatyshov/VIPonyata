import React from "react";

import CSS from "csstype";

import { useDraggable } from "@dnd-kit/core";
import { CSS as DNDCSS } from "@dnd-kit/utilities";

import styles from "../StyleAssessmentType.module.css";

export type DraggableType = "answer" | "inputs";

export interface FieldData {
    fieldId: number;
    type: DraggableType;
}

export const isFieldData = (data: any): data is FieldData => data !== undefined;

interface DraggableProps {
    id: number;
    str: string;
    width: number;
    type: DraggableType;
}

const Draggable = ({ id, str, width, type }: DraggableProps) => {
    const data: FieldData = { fieldId: id, type };
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `${str}_${id}`,
        data,
    });

    const style: CSS.Properties = {
        transform: DNDCSS.Translate.toString(transform),
        minWidth: `calc(${width}em * 0.75)`,
        maxWidth: `calc(${width}em * 0.75)`,
    };

    const className = `${styles.fillSpaceExistsDraggable} w-100`;

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={className}>
            <div className="dnd-prevent-select mx-auto">{str}</div>
        </div>
    );
};

export default Draggable;
