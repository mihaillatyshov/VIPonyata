import React from "react";
import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";

const StudentAssessmentFillSpacesByHand = ({ data, taskId }: StudentAssessmentTypeProps) => {
    const dispatch = useAppDispatch();

    const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>, fieldId: number) => {
        console.log(e.target.value);
        data.answers[fieldId] = e.target.value;
        // TODO Add message to server
        dispatch(setAssessmentTaskData({ id: taskId, data: data }));
    };

    return (
        <div>
            <div>
                {data.separates.map((element: string, i: number) => (
                    <span key={i}>
                        {element}
                        {i < data.separates.length - 1 && (
                            <input type="text" value={data.answers[i]} onChange={(e) => onChangeHandler(e, i)} />
                        )}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default StudentAssessmentFillSpacesByHand;
