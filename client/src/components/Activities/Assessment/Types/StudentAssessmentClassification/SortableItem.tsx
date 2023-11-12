import React from "react";

import CSS from "csstype";

import { useSortable } from "@dnd-kit/sortable";
import { CSS as DNDCSS } from "@dnd-kit/utilities";

import styles from "../StyleAssessmentType.module.css";

interface ItemProps {
    str: string;
    width: number;
}

interface SortableItemProps {
    id: string;
    str: string;
    strWidth: number;
}

export function Item({ str, width }: ItemProps) {
    const style: CSS.Properties = {
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid black",
        margin: "10px 0",
        padding: "6px",
        background: "white",
        minWidth: `calc(${width}em * 1)`,
    };

    return (
        <div className={`prevent-select ${styles.classificationItem}`} style={style}>
            {str}
        </div>
    );
}

export default function SortableItem({ id, str, strWidth }: SortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: DNDCSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Item str={str} width={strWidth} />
        </div>
    );
}
