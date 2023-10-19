import React from "react";

import { TAssessmentTestSingle } from "models/Activity/Items/TAssessmentItems";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";

import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentTestSingle = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentTestSingle>) => {
    const dispatch = useAppDispatch();

    const onChangeHandler = (newId: number) => {
        console.log("newId: ", newId);
        data.answer = newId;
        dispatch(setAssessmentTaskData({ id: taskId, data: data }));
    };

    return (
        <div>
            <div>{data.question}</div>
            {data.options.map((answer: string, fieldId: number) => (
                <div key={fieldId}>
                    <input
                        className="form-check-input me-2"
                        type="radio"
                        checked={fieldId === data.answer}
                        onChange={() => onChangeHandler(fieldId)}
                        name={`radio_${taskId}`}
                        id={`radio_${taskId}_${fieldId}`}
                    />
                    <label htmlFor={`radio_${taskId}_${fieldId}`}>{answer}</label>
                </div>
            ))}
        </div>
    );
};

export default StudentAssessmentTestSingle;
