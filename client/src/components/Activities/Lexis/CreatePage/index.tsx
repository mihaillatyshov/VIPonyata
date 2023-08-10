import React from "react";
import { LexisName } from "components/Activities/Lexis/Types/LexisUtils";
import Tasks, { SelectableTask } from "./Tasks";
import { LexisTaskName, LexisTaskNameSelectable } from "models/Activity/ILexis";
import { DragEndEvent } from "@dnd-kit/core";

interface LexisCreatePageProps {
    title: string;
    name: LexisName;
}

const LexisCreatePage = ({ title, name }: LexisCreatePageProps) => {
    const tasks: SelectableTask[] = Object.values(LexisTaskName)
        .filter((taskName) => taskName !== "card")
        .map((taskName) => ({ name: taskName, isSelected: false }));
    console.log(tasks);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over === null) return;

        // TODO: Find index in array of task element
        if (active?.data?.current?.id !== over?.data?.current?.id) {
            data.parts = arrayMove(
                data.parts,
                active.data.current?.arrayId as number,
                over.data.current?.arrayId as number
            );
            dispatch(setAssessmentTaskData({ id: taskId, data: data }));
        }
    };

    return (
        <div className="container">
            <div>{title}</div>
            <Tasks tasks={tasks} handleDragEnd={handleDragEnd} />
        </div>
    );
};

export default LexisCreatePage;
