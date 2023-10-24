import React from "react";

import { TAssessmentFillSpacesExists } from "models/Activity/Items/TAssessmentItems";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";

import {
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";

import { StudentAssessmentTypeProps } from "../StudentAssessmentTypeProps";
import { isFieldData } from "./Draggable";
import Droppable from "./Droppable";
import InputsField from "./InputsField";

const StudentAssessmentFillSpacesExists = ({
    data,
    taskId,
}: StudentAssessmentTypeProps<TAssessmentFillSpacesExists>) => {
    const dispatch = useAppDispatch();

    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor), useSensor(KeyboardSensor));

    const handleAnsInp = (answerId: number) => {
        const answer = data.answers[answerId];
        if (answer === null) {
            return;
        }
        data.inputs.push(answer);
        data.answers[answerId] = null;
    };

    const handleInpAns = (inputId: number, answerId: number) => {
        const answer = data.answers[answerId];
        if (answer !== null) {
            data.inputs.push(answer);
        }

        data.answers[answerId] = data.inputs.splice(inputId, 1)[0];
    };

    const handleAnsAns = (fromId: number, toId: number) => {
        [data.answers[fromId], data.answers[toId]] = [data.answers[toId], data.answers[fromId]];
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        console.log(active, over);
        const activeData = active.data.current;
        if (!isFieldData(activeData)) {
            return;
        }
        if (over === null) {
            if (activeData.type === "answer") {
                handleAnsInp(activeData.fieldId);
            }
        } else {
            const overData = over.data.current;
            if (!isFieldData(overData)) return;

            if (activeData.type === "inputs" && overData.type === "answer") {
                handleInpAns(activeData.fieldId, overData.fieldId);
            } else if (activeData.type === "answer" && overData.type === "answer") {
                handleAnsAns(activeData.fieldId, overData.fieldId);
            }
        }
        dispatch(setAssessmentTaskData({ id: taskId, data: data }));
    };

    const itemWidth = Math.max(
        ...data.inputs.map((item) => item.length),
        ...data.answers.map((item) => (item ? item.length : 0)),
        5
    );

    return (
        <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
            <InputsField inputFields={data.inputs} width={itemWidth} />
            <div className="d-flex flex-wrap mt-3">
                {data.separates.map((element: string, fieldId: number) => (
                    <div key={fieldId} className="d-flex flex-wrap">
                        <div className="mx-2 mt-2">{element}</div>
                        {fieldId < data.separates.length - 1 && (
                            <Droppable id={fieldId} width={itemWidth} str={data.answers[fieldId]} />
                        )}
                    </div>
                ))}
            </div>
        </DndContext>
    );
};

export default StudentAssessmentFillSpacesExists;
