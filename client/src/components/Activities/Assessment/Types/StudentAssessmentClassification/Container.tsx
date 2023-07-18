import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";
import { ItemState } from ".";
import CSS from "csstype";
import styles from "../StyleAssessmentType.module.css";

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
        type === "inputs" ? `${styles.classificationInputs}` : `flex-column ${styles.classificationAnswers}`;

    return (
        <SortableContext id={`${id}`} items={items.map(({ strId }) => strId)} strategy={rectSortingStrategy}>
            <div
                ref={setNodeRef}
                className={`p-3 m-3 bg-secondary d-flex  ${className}`}
                style={type === "inputs" ? {} : style}
            >
                {items.map(({ str, strId }) => (
                    <SortableItem key={strId} id={strId} str={str} strWidth={strWidth} />
                ))}
            </div>
        </SortableContext>
    );
}
