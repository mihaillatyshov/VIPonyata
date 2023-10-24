import React from "react";

import CSS from "csstype";

import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";

import styles from "../StyleAssessmentType.module.css";
import { ItemState } from "./";
import SortableItem from "./SortableItem";

interface ContainerProps {
    id: number;
    items: ItemState[];
    type: "inputs" | "answer";
    strWidth: number;
}

export default function Container({ id, items, type, strWidth }: ContainerProps) {
    const { setNodeRef } = useDroppable({ id });

    const style: CSS.Properties = {
        minWidth: `calc(${strWidth}em * 1.1)`,
        maxWidth: `calc(${strWidth}em * 1.1)`,
    };

    const className =
        type === "inputs"
            ? `w-100 mb-3 ${styles.classificationInputs}`
            : `flex-column m-3 ${styles.classificationAnswers}`;

    return (
        <SortableContext id={`${id}`} items={items.map(({ strId }) => strId)} strategy={rectSortingStrategy}>
            <div
                ref={setNodeRef}
                className={`p-2 bg-secondary d-flex ${className}`}
                style={type === "inputs" ? {} : style}
            >
                {items.map(({ str, strId }) => (
                    <SortableItem key={strId} id={strId} str={str} strWidth={strWidth} />
                ))}
            </div>
        </SortableContext>
    );
}
