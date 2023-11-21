import React, { useEffect, useMemo, useState } from "react";

import { FindMaxStr } from "libs/Autisize";
import { TAssessmentClassification } from "models/Activity/Items/TAssessmentItems";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";

import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    MouseSensor,
    pointerWithin,
    TouchSensor,
    UniqueIdentifier,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import { StudentAssessmentTypeProps } from "../StudentAssessmentTypeProps";
import Container from "./Container";
import { Item } from "./SortableItem";

export interface ItemState {
    strId: string;
    str: string;
}

const StudentAssessmentClassification = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentClassification>) => {
    const dispatch = useAppDispatch();

    const [items, setItems] = useState<ItemState[][]>(() => {
        const inputs: ItemState[] = data.inputs.map((str, i) => ({ strId: `id_${i}`, str }));
        const answers: ItemState[][] = data.answers.map((col, i) =>
            col.map((str, j) => ({ strId: `id_${i}_${j}`, str })),
        );
        return [inputs, ...answers];
    });

    const longestStr = useMemo(
        () => FindMaxStr([data.inputs, ...data.answers].map(FindMaxStr)),
        [data.inputs, data.answers],
    );

    useEffect(() => {
        const newData = {
            ...data,
            inputs: items[0].map(({ str }) => str),
            answers: items.slice(1).map((col) => col.map(({ str }) => str)),
        };

        dispatch(setAssessmentTaskData({ id: taskId, data: newData }));
    }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

    const [active, setActive] = useState<ItemState | null>(null);

    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor), useSensor(KeyboardSensor));

    const findContainer = (id: UniqueIdentifier): number => {
        if (Number.isInteger(id)) {
            return id as number;
        }

        return items.findIndex((col) => undefined !== col.find(({ strId }) => id === strId));
    };

    const findIndex = (col: ItemState[], id: UniqueIdentifier): number => {
        return col.findIndex(({ strId }) => id === strId);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const { id } = active;

        const containerId = findContainer(id);
        const index = findIndex(items[containerId], id);
        setActive(items[containerId][index]);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over, delta } = event;
        const { id } = active;
        if (!over || !active.rect) return;
        const { id: overId } = over;

        if (id === overId) {
            return;
        }
        const activeContainerId = findContainer(id);
        const overContainerId = findContainer(overId);
        if (activeContainerId === overContainerId) {
            return;
        }

        setItems((prev): ItemState[][] => {
            const activeItems = prev[activeContainerId];
            const overItems = prev[overContainerId];

            const activeIndex = findIndex(activeItems, id);
            const overIndex = findIndex(overItems, overId);

            let newIndex;
            if (overId in prev) {
                newIndex = overItems.length + 1;
            } else {
                const isBelowLastItem =
                    over && overIndex === overItems.length - 1 && delta.y > over.rect.top + over.rect.height;

                const modifier = isBelowLastItem ? 1 : 0;

                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            }

            return Object.assign([], {
                ...prev,
                [activeContainerId]: [...prev[activeContainerId].filter((item) => item.strId !== active.id)],
                [overContainerId]: [
                    ...prev[overContainerId].slice(0, newIndex),
                    items[activeContainerId][activeIndex],
                    ...prev[overContainerId].slice(newIndex, prev[overContainerId].length),
                ],
            });
        });
    };
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) {
            return;
        }
        const { id } = active;
        const { id: overId } = over;

        const activeContainer = findContainer(id);
        const overContainer = findContainer(overId);

        if (id === overId) {
            return;
        }

        if (activeContainer !== overContainer) {
            return;
        }

        const activeIndex = findIndex(items[activeContainer], active.id);
        const overIndex = findIndex(items[overContainer], overId);

        if (activeIndex !== overIndex) {
            setItems((items) =>
                Object.assign([], {
                    ...items,
                    [overContainer]: arrayMove(items[overContainer], activeIndex, overIndex),
                }),
            );
        }

        setActive(null);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="d-flex justify-content-center">
                <Container id={0} items={items[0]} type="inputs" longestStr={longestStr} />
            </div>
            <div className="d-flex flex-wrap justify-content-center gap-3">
                {items.slice(1).map((col, i) => (
                    <Container
                        key={i + 1}
                        id={i + 1}
                        items={col}
                        type="answer"
                        longestStr={longestStr}
                        title={data.titles[i]}
                    />
                ))}
            </div>
            <DragOverlay style={{ opacity: "60%" }}>
                {active ? <Item str={active.str} longestStr={longestStr} /> : null}
            </DragOverlay>
        </DndContext>
    );
};

export default StudentAssessmentClassification;
