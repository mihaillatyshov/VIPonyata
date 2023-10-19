import React from "react";

import { TAssessmentTestMulti } from "models/Activity/Items/TAssessmentItems";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";

import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentTestMulti = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentTestMulti>) => {
    const dispatch = useAppDispatch();

    const onChangeHandler = (fieldId: number) => {
        console.log("newId: ", fieldId, data.answers.includes(fieldId));
        if (data.answers.includes(fieldId)) {
            data.answers.splice(data.answers.indexOf(fieldId), 1);
        } else {
            data.answers.push(fieldId);
        }
        dispatch(setAssessmentTaskData({ id: taskId, data: data }));
    };

    return (
        <div>
            <div>{data.question}</div>
            {data.options.map((answer: string, fieldId: number) => (
                <div key={fieldId}>
                    <input
                        className="form-check-input me-2"
                        type="checkbox"
                        checked={data.answers.includes(fieldId)}
                        onChange={() => onChangeHandler(fieldId)}
                        name={`check_${taskId}`}
                        id={`check_${taskId}_${fieldId}`}
                    />
                    <label htmlFor={`check_${taskId}_${fieldId}`}>{answer}</label>
                </div>
            ))}
        </div>
    );
};

export default StudentAssessmentTestMulti;
