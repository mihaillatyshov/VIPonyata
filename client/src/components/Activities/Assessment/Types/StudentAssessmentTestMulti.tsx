import React from "react";
import ReactMarkdown from "react-markdown";

import InputCheckSingle from "components/Form/InputCheckSingle";
import { TAssessmentTestMulti } from "models/Activity/Items/TAssessmentItems";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";

import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentTestMulti = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentTestMulti>) => {
    const dispatch = useAppDispatch();

    const onChangeHandler = (fieldId: number) => {
        if (data.answers.includes(fieldId)) {
            data.answers.splice(data.answers.indexOf(fieldId), 1);
        } else {
            data.answers.push(fieldId);
        }
        dispatch(setAssessmentTaskData({ id: taskId, data: data }));
    };

    return (
        <div className="student-assessment-test">
            <div className="prevent-select md-last-pad-zero">
                <ReactMarkdown>{data.question}</ReactMarkdown>
            </div>

            <div className="student-assessment-test__options">
                {data.options.map((answer: string, fieldId: number) => (
                    <div key={fieldId} className="input-group">
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
        </div>
    );
};

export default StudentAssessmentTestMulti;
