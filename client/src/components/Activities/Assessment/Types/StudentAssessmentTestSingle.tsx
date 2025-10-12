import React from "react";

import { ReactMarkdownWithHtml } from "components/Common/ReactMarkdownWithHtml";
import InputRadioSingle from "components/Form/InputRadioSingle";
import { TAssessmentTestSingle } from "models/Activity/Items/TAssessmentItems";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";

import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentTestSingle = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentTestSingle>) => {
    const dispatch = useAppDispatch();

    const onChangeHandler = (newId: number) => {
        data.answer = newId;
        dispatch(setAssessmentTaskData({ id: taskId, data: data }));
    };

    return (
        <div className="student-assessment-test">
            <div className="prevent-select md-last-pad-zero">
                <ReactMarkdownWithHtml>{data.question}</ReactMarkdownWithHtml>
            </div>

            <div className="student-assessment-test__options">
                {data.options.map((answer: string, fieldId: number) => (
                    <div key={fieldId} className="input-group">
                        <InputRadioSingle
                            key={fieldId}
                            htmlId={`radio_${taskId}_${fieldId}`}
                            id={fieldId}
                            className="input-group-text big-check"
                            placeholder={""}
                            selectedId={data.answer ?? -1}
                            onChange={onChangeHandler}
                        />
                        <span className="form-control prevent-select">{answer}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentAssessmentTestSingle;
