import React from "react";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import SortableTaskItem from "./SortableTaskItem";
import { LexisTaskName } from "models/Activity/ILexis";

export type SelectableTask = { name: LexisTaskName; isSelected: boolean };

interface TasksProps {
    tasks: SelectableTask[];
    handleDragEnd: (event: DragEndEvent) => void;
    setSelected: (taskName: LexisTaskName, checked: boolean) => void;
}

const Tasks = ({ tasks, handleDragEnd, setSelected }: TasksProps) => {
    return (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
