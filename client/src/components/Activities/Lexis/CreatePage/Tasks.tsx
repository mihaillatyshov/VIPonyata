import React from "react";

import { LexisTaskName } from "models/Activity/ILexis";

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

import SortableTaskItem from "./SortableTaskItem";

export type SelectableTask = { name: LexisTaskName; isSelected: boolean };

interface TasksProps {
    tasks: SelectableTask[];
    handleDragEnd: (event: DragEndEvent) => void;
    setSelected: (taskName: LexisTaskName, checked: boolean) => void;
}

const Tasks = ({ tasks, handleDragEnd, setSelected }: TasksProps) => {
    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor), useSensor(KeyboardSensor));

    return (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
            <div className="container d-flex">
                <SortableContext items={tasks.map(({ name }) => name)} strategy={rectSortingStrategy}>
                    <div className="d-flex mx-auto">
                        {tasks.map(({ name, isSelected }) => (
                            <SortableTaskItem
                                key={name}
                                taskName={name}
                                isSelected={isSelected}
                                setSelected={setSelected}
                            />
                        ))}
                    </div>
                </SortableContext>
            </div>
        </DndContext>
    );
};

export default Tasks;
