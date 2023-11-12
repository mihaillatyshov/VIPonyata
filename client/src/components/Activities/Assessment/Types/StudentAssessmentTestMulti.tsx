import React from "react";

import InputCheckSingle from "components/Form/InputCheckSingle";
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
            <div className="mb-3">{data.question}</div>
            {data.options.map((answer: string, fieldId: number) => (
                <div key={fieldId} className="input-group mt-1">
                    <InputCheckSingle
                        key={fieldId}
                        htmlId={`radio_${taskId}_${fieldId}`}
                        id={fieldId}
                        className="input-group-text big-check"
                        placeholder={""}
                        selectedIds={data.answers}
                        onChange={onChangeHandler}
                    />
                    <span className="form-control prevent-select">{answer}</span>
                </div>
            ))}
        </div>
    );
};

export default StudentAssessmentTestMulti;
