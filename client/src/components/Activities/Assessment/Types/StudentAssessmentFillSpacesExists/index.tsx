import React, { useMemo } from "react";

import { FindMaxStr } from "libs/Autisize";
import { TAssessmentFillSpacesExists, TAssessmentFillSpacesExistsEmpty } from "models/Activity/Items/TAssessmentItems";
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

    const longestStr = useMemo(
        () =>
            FindMaxStr(
                [...data.inputs, ...data.answers, TAssessmentFillSpacesExistsEmpty].filter(
                    (item) => item !== null,
                ) as string[],
            ),
        [data.inputs, data.answers],
    );

    return (
        <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
            <InputsField inputFields={data.inputs} longestStr={longestStr} />
            <div className="d-flex flex-wrap align-items-center mt-3">
                {data.separates.map((element: string, fieldId: number) => (
                    <React.Fragment key={fieldId}>
                        <div className="prevent-select me-2 mt-2">{element}</div>
                        {fieldId < data.separates.length - 1 && (
                            <Droppable id={fieldId} longestStr={longestStr} str={data.answers[fieldId]} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </DndContext>
    );
};

export default StudentAssessmentFillSpacesExists;
