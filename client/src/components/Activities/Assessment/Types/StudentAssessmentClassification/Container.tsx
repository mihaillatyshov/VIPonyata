import React from "react";

import AutosizeDiv from "libs/AutosizeDiv";

import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";

import { ItemState } from "./";
import SortableItem from "./SortableItem";

interface ContainerProps {
    id: number;
    items: ItemState[];
    type: "inputs" | "answer";
    title?: string;
    longestStr: string;
}

export default function Container({ id, items, title, type, longestStr }: ContainerProps) {
    const { setNodeRef } = useDroppable({ id });

    const className =
        type === "inputs"
            ? "w-100 mb-3 student-assessment-classification__inputs"
            : "flex-column student-assessment-classification__answers";

    return (
        <SortableContext id={`${id}`} items={items.map(({ strId }) => strId)} strategy={rectSortingStrategy}>
            <div ref={setNodeRef} className={`p-2 d-flex my-card ${className}`}>
                <div className="student-assessment-classification__column-title">{title}</div>
                {title ? (
                    <>
                        <AutosizeDiv
                            value={""}
                            valueToCalcSize={longestStr}
                            inputClassName="student-assessment-classification__item-autosize"
                            className="student-assessment-classification__item-autosize"
                        />
                        <hr className="m-0 mb-2" />
                    </>
                ) : null}
                {items.map(({ str, strId }) => (
                    <SortableItem key={strId} id={strId} str={str} longestStr={longestStr} />
                ))}
            </div>
        </SortableContext>
    );
}
