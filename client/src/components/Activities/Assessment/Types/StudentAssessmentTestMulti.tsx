import React from "react";
import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";

const StudentAssessmentTestMulti = ({ data, taskId }: StudentAssessmentTypeProps) => {
    const dispatch = useAppDispatch();

    const onChangeHandler = (fieldId: number) => {
        console.log("newId: ", fieldId, data.answers.includes(fieldId));
        if (data.answers.includes(fieldId)) {
            data.answers.splice(data.answers.indexOf(fieldId), 1);
        } else {
            data.answers.push(fieldId);
        }
        // TODO Add message to server
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
