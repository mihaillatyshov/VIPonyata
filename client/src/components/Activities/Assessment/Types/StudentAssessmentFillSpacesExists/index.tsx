import React from "react";
import { StudentAssessmentTypeProps } from "../StudentAssessmentTypeProps";
import AnswerField from "./AnswerField";
import InputsField from "./InputsField";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";
import { SwapDataProps } from "./DragAndDrop";
import { TAssessmentFillSpacesExists } from "models/Activity/Items/TAssessmentItems";

const StudentAssessmentFillSpacesExists = ({
    data,
    taskId,
}: StudentAssessmentTypeProps<TAssessmentFillSpacesExists>) => {
    const dispatch = useAppDispatch();
    const accept = `dnd_ac_${taskId}`;

    const handleAnsInp = (swapData: SwapDataProps) => {
        const answerId = swapData.from.id;

        const answer = data.answers[answerId];
        if (answer === null) {
            return;
        }
        data.inputs.push(answer);
        data.answers[answerId] = null;
    };

    const handleInpAns = (swapData: SwapDataProps) => {
        const inputId = swapData.from.id;
        const answerId = swapData.to.id;

        const answer = data.answers[answerId];
        if (answer !== null) {
            data.inputs.push(answer);
        }

        data.answers[answerId] = data.inputs.splice(inputId, 1)[0];
    };

    const handleAnsAns = (swapData: SwapDataProps) => {
        const fromId = swapData.from.id;
        const toId = swapData.to.id;

        [data.answers[fromId], data.answers[toId]] = [data.answers[toId], data.answers[fromId]];
    };

    const onDropHandle = (swapData: SwapDataProps) => {
        console.log(swapData);
        if (swapData.from.name === "answers" && swapData.to.name === "answers") {
            handleAnsAns(swapData);
        } else if (swapData.from.name === "answers" && swapData.to.name === "inputs") {
            handleAnsInp(swapData);
        } else if (swapData.from.name === "inputs" && swapData.to.name === "answers") {
            handleInpAns(swapData);
        }
        dispatch(setAssessmentTaskData({ id: taskId, data: data }));
    };

    return (
        <div>
            <InputsField accept={accept} inputFields={data.inputs} onDropCallback={onDropHandle} />
            <hr />
            <div className="d-flex">
                {data.separates.map((element: string, fieldId: number) => (
                    <div key={fieldId} className="d-flex">
                        <div className="mx-2">{element}</div>
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
