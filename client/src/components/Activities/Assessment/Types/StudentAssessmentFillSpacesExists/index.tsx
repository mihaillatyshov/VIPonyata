import React from "react";
import { StudentAssessmentTypeProps } from "../StudentAssessmentTypeProps";
import InputsField from "./InputsField";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";
import { TAssessmentFillSpacesExists } from "models/Activity/Items/TAssessmentItems";
import Droppable from "./Droppable";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { isFieldData } from "./Draggable";

const StudentAssessmentFillSpacesExists = ({
    data,
    taskId,
}: StudentAssessmentTypeProps<TAssessmentFillSpacesExists>) => {
    const dispatch = useAppDispatch();

    // const handleAnsInp = (swapData: SwapDataProps) => {
    //     const answerId = swapData.from.id;

    //     const answer = data.answers[answerId];
    //     if (answer === null) {
    //         return;
    //     }
    //     data.inputs.push(answer);
    //     data.answers[answerId] = null;
    // };

    // const handleInpAns = (swapData: SwapDataProps) => {
    //     const inputId = swapData.from.id;
    //     const answerId = swapData.to.id;

    //     const answer = data.answers[answerId];
    //     if (answer !== null) {
    //         data.inputs.push(answer);
    //     }

    //     data.answers[answerId] = data.inputs.splice(inputId, 1)[0];
    // };

    // const handleAnsAns = (swapData: SwapDataProps) => {
    //     const fromId = swapData.from.id;
    //     const toId = swapData.to.id;

    //     [data.answers[fromId], data.answers[toId]] = [data.answers[toId], data.answers[fromId]];
    // };

    // const onDropHandle = (swapData: SwapDataProps) => {
    //     console.log(swapData);
    //     if (swapData.from.name === "answers" && swapData.to.name === "answers") {
    //         handleAnsAns(swapData);
    //     } else if (swapData.from.name === "answers" && swapData.to.name === "inputs") {
    //         handleAnsInp(swapData);
    //     } else if (swapData.from.name === "inputs" && swapData.to.name === "answers") {
    //         handleInpAns(swapData);
    //     }
    //     dispatch(setAssessmentTaskData({ id: taskId, data: data }));
    // };

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
        <DndContext onDragEnd={handleDragEnd}>
            <InputsField inputFields={data.inputs} width={itemWidth} />
            <hr />
            <div className="d-flex flex-wrap">
                {data.separates.map((element: string, fieldId: number) => (
                    <div key={fieldId} className="d-flex flex-wrap">
                        <div className="mx-2">{element}</div>
                        {fieldId < data.separates.length - 1 && (
                            <Droppable id={fieldId} width={itemWidth} str={data.answers[fieldId]} />
                            // <AnswerField
                            //     accept={accept}
                            //     fieldId={fieldId}
                            //     text={data.answers[fieldId]}
                            //     onDropCallback={onDropHandle}
                            // />
                        )}
                    </div>
                ))}
            </div>
        </DndContext>
    );
};

export default StudentAssessmentFillSpacesExists;
