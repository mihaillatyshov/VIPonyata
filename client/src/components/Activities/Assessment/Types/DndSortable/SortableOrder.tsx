import React, { useMemo } from "react";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";
import { TAssessmentCreateSentence, TAssessmentSentenceOrder } from "models/Activity/Items/TAssessmentItems";

interface TLocalPart {
    strId: string;
    str: string;
    arrayId: number;
}

interface SortableOrderProps {
    handleDragEnd: (event: DragEndEvent) => void;
    order: "vertical" | "horizontal";
    data: TAssessmentCreateSentence | TAssessmentSentenceOrder;
}

const SortableOrder = ({ handleDragEnd, order, data }: SortableOrderProps) => {
    const sortContextClassName = `d-flex mx-auto ${order === "horizontal" ? "flex-wrap" : "flex-column "} gap-3`;

    const localParts: TLocalPart[] = useMemo(() => {
        return data.parts.map((item, id) => ({
            strId: `${item}_${id}`,
            str: item,
            arrayId: id,
        }));
    }, [data.parts]);

    const itemWidth = Math.max(...localParts.map((item) => item.str.length), 3);

    return (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="container">
                <SortableContext items={localParts.map((item) => item.strId)} strategy={rectSortingStrategy}>
                    <div className={sortContextClassName}>
                        {localParts.map((item) => (
                            <SortableItem
                                key={item.strId}
                                id={item.strId}
                                str={item.str}
                                customData={{ arrayId: item.arrayId }}
                                width={itemWidth}
                            />
                        ))}
                    </div>
                </SortableContext>
            </div>
        </DndContext>
    );
};

export default SortableOrder;
