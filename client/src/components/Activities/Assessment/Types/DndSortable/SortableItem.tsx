import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS as DNDCSS } from "@dnd-kit/utilities";
import CSS from "csstype";
import styles from "../StyleAssessmentType.module.css";

interface SortableItemProps {
    id: string;
    str: string;
    customData: any;
    width: number;
}

const SortableItem = ({ id, str, customData, width }: SortableItemProps) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: id,
        data: customData,
    });

    const style: CSS.Properties = {
        transform: DNDCSS.Transform.toString(transform),
        transition,
        minWidth: `calc(${width}em * 0.75)`,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`d-flex ${styles.createSentenceItem}`}
        >
            <div className="mx-auto">{str}</div>
        </div>
    );
};

export default SortableItem;