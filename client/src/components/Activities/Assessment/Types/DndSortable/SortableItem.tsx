import React from "react";

import { ReactMarkdownWithHtml } from "components/Common/ReactMarkdownWithHtml";
import CSS from "csstype";

import { useSortable } from "@dnd-kit/sortable";
import { CSS as DNDCSS } from "@dnd-kit/utilities";

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
            className="student-assessment-view-sortable-order__item"
        >
            <div className="prevent-select md-last-no-margin">
                <ReactMarkdownWithHtml>{str}</ReactMarkdownWithHtml>
            </div>
        </div>
    );
};

export default SortableItem;
