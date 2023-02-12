import React from "react";
import { StudentAssessmentTypeProps } from "../StudentAssessmentTypeProps";
import AnswerField from "./AnswerField";
import InputsField from "./InputsField";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";
import { SwapDataProps } from "./DragAndDrop";

const StudentAssessmentFillSpacesExists = ({ data, taskId }: StudentAssessmentTypeProps) => {
    const dispatch = useAppDispatch();
    const accept = `dnd_ac_${taskId}`;

    const handleAnsInp = (swapData: SwapDataProps) => {
        const answerId = swapData.from.id;

        data.inputs.push(data.answers[answerId]);
        data.answers[answerId] = null;
    };

    const handleInpAns = (swapData: SwapDataProps) => {
        const inputId = swapData.from.id;
        const answerId = swapData.to.id;

        if (data.answers[answerId] !== null) {
            data.inputs.push(data.answers[answerId]);
        }

        data.answers[answerId] = data.inputs[inputId];
        data.inputs.splice(inputId, 1);
    };

    const handleAnsAns = (swapData: SwapDataProps) => {
        const fromId = swapData.from.id;
        const toId = swapData.to.id;

        [data.answers[fromId], data.answers[toId]] = [data.answers[toId], data.answers[fromId]];
    };

    const onDropHandle = (swapData: SwapDataProps) => {
        console.log(
            "SD: from: {",
            swapData.from.id,
            swapData.from.name,
            "}, to: {",
            swapData.to.id,
            swapData.to.name,
            "}"
        );
        if (swapData.from.name === "inputs" && swapData.to.name === "inputs") {
            console.log("ii");
        } else if (swapData.from.name === "answers" && swapData.to.name === "inputs") {
            handleAnsInp(swapData);
        } else if (swapData.from.name === "inputs" && swapData.to.name === "answers") {
            handleInpAns(swapData);
        } else {
            handleAnsAns(swapData);
        }
        dispatch(setAssessmentTaskData({ id: taskId, data: data }));
    };

    const first: SwapDataProps = { from: { id: 0, name: "inputs" }, to: { id: 0, name: "answers" } };
    const second: SwapDataProps = { from: { id: 0, name: "inputs" }, to: { id: 1, name: "answers" } };
    const third: SwapDataProps = { from: { id: 1, name: "answers" }, to: { id: 0, name: "inputs" } };
    return (
        <div>
            <input type="button" value="i0 a0" onClick={() => onDropHandle(first)} />
            <input type="button" value="i0 a1" onClick={() => onDropHandle(second)} />
            <input type="button" value="a1 i0" onClick={() => onDropHandle(third)} />
            <InputsField accept={accept} inputFields={data.inputs} onDropCallback={onDropHandle} />
            <hr />
            <div>
                {data.separates.map((element: string, fieldId: number) => (
                    <div key={fieldId}>
                        <div>{element}</div>
                        {fieldId < data.separates.length - 1 && (
                            <AnswerField
                                accept={accept}
                                fieldId={fieldId}
                                text={data.answers[fieldId]}
                                onDropCallback={onDropHandle}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentAssessmentFillSpacesExists;
