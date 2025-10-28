import React, { useMemo } from "react";

import { fixRubyStr } from "libs/Autisize";
import { TAssessmentCreateSentence, TAssessmentSentenceOrder } from "models/Activity/Items/TAssessmentItems";

import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";

import SortableItem from "./SortableItem";

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
    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor), useSensor(KeyboardSensor));

    const sortContextClassName = `student-assessment-sortable-order ${
        order === "horizontal" ? "horizontal" : "vertical"
    } `;

    const localParts: TLocalPart[] = useMemo(() => {
        return data.parts.map((item, id) => ({
            strId: `${item}_${id}`,
            str: item,
            arrayId: id,
        }));
    }, [data.parts]);

    const itemWidth = Math.max(...localParts.map((item) => fixRubyStr(item.str).length), 3);

    return (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors} autoScroll={false}>
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
        </DndContext>
    );
};

export default SortableOrder;
