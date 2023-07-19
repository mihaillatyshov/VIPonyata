import React, { useEffect, useState } from "react";
import { TAssessmentClassification } from "models/Activity/Items/TAssessmentItems";
import { StudentAssessmentTypeProps } from "../StudentAssessmentTypeProps";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";
import { useAppDispatch } from "redux/hooks";
import {
    DndContext,
    useSensors,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    DragOverlay,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    UniqueIdentifier,
    pointerWithin,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
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
            col.map((str, j) => ({ strId: `id_${i}_${j}`, str }))
        );
        return [inputs, ...answers];
    });

    const strWidth = Math.max(
        ...[data.inputs, ...data.answers].map((col) => Math.max(...col.map((str) => str.length))),
        5
    );
    console.log(strWidth);

    useEffect(() => {
        data.inputs = items[0].map(({ str }) => str);
        data.answers = items.slice(1).map((col) => col.map(({ str }) => str));

        dispatch(setAssessmentTaskData({ id: taskId, data: data }));
    }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

    const [active, setActive] = useState<ItemState | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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
                })
            );
        }

        setActive(null);
    };

    return (
        <div>
            <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div>
                    <Container id={0} items={items[0]} type="inputs" strWidth={strWidth} />
                </div>
                <div className="d-flex flex-wrap justify-content-center">
                    {items.slice(1).map((col, i) => (
                        <Container key={i + 1} id={i + 1} items={col} type="answer" strWidth={strWidth} />
                    ))}
                </div>
                <DragOverlay>{active ? <Item str={active.str} width={strWidth} /> : null}</DragOverlay>
            </DndContext>
        </div>
    );
};

export default StudentAssessmentClassification;
