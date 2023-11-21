import React from "react";

import AutosizeDiv from "libs/AutosizeDiv";

import { useSortable } from "@dnd-kit/sortable";
import { CSS as DNDCSS } from "@dnd-kit/utilities";

interface ItemProps {
    str: string;
    longestStr: string;
}

interface SortableItemProps {
    id: string;
    str: string;
    longestStr: string;
}

export function Item({ str, longestStr }: ItemProps) {
    return (
        <AutosizeDiv
            value={str}
            valueToCalcSize={longestStr}
            inputClassName="student-assessment-classification__item text-center"
            className="student-assessment-classification__item-autosize"
        />
    );
}

export default function SortableItem({ id, str, longestStr }: SortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: DNDCSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Item str={str} longestStr={longestStr} />
        </div>
    );
}
