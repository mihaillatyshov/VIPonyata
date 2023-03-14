import React from "react";
import { TAssessmentClassification } from "models/Activity/Items/TAssessmentItems";
import { StudentAssessmentTypeProps } from "../StudentAssessmentTypeProps";
import ItemsField from "./ItemsField";
import { SwapDataProps } from "./DragAndDrop";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";
import { useAppDispatch } from "redux/hooks";

const StudentAssessmentClassification = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentClassification>) => {
    const dispatch = useAppDispatch();
    const accept = `dnd_ac_${taskId}`;

    const handleAnsInp = (swapData: SwapDataProps) => {
        const fromValue = data.answers[swapData.from.colId].splice(swapData.from.id, 1)[0];
        data.inputs.push(fromValue);
    };

    const handleInpAns = (swapData: SwapDataProps) => {
        const inputId = swapData.from.id;
        const answerColId = swapData.to.colId;

        const inputValue = data.inputs.splice(inputId, 1)[0];
        data.answers[answerColId].push(inputValue);
    };

    const handleAnsAns = (swapData: SwapDataProps) => {
        const fromValue = data.answers[swapData.from.colId].splice(swapData.from.id, 1)[0];
        data.answers[swapData.to.colId].push(fromValue);
    };

    const onDropHandle = (swapData: SwapDataProps) => {
        console.log("StudentAssessmentClassification SD", swapData);
        if (swapData.from.name === "answers" && swapData.to.name === "answers") {
            handleAnsAns(swapData);
        } else if (swapData.from.name === "answers" && swapData.to.name === "inputs") {
            handleAnsInp(swapData);
        } else if (swapData.from.name === "inputs" && swapData.to.name === "answers") {
            handleInpAns(swapData);
        }
        dispatch(setAssessmentTaskData({ id: taskId, data: data }));
    };

    console.log("TAssessmentClassification", data);
    return (
        <div>
            <ItemsField
                accept={accept}
                dragFields={data.inputs}
                onDropCallback={onDropHandle}
                fieldName="inputs"
                answerColId={-1}
            />
            <div>
                {data.inputs.map((element: string, i: number) => (
                    <span key={i}>{element}</span>
                ))}
            </div>
            <div className="row mx-0">
                {data.titles.map((element: string, i: number) => (
                    <div className="col-auto" key={i}>
                        {element}
                        <ItemsField
                            accept={accept}
                            dragFields={data.answers[i]}
                            onDropCallback={onDropHandle}
                            fieldName="answers"
                            answerColId={i}
                            additionalClasses="d-flex flex-column"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentAssessmentClassification;
