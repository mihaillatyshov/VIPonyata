import React from "react";

import { FloatingLabelTextareaAutosize } from "components/Form/FloatingLabelTextareaAutosize";
import { TAssessmentOpenQuestion } from "models/Activity/Items/TAssessmentItems";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";

import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentOpenQuestion = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentOpenQuestion>) => {
    const dispatch = useAppDispatch();

    const onChangeHandler = (value: string) => {
        data.answer = value;
        dispatch(setAssessmentTaskData({ id: taskId, data: data }));
    };

    return (
        <div className="student-assessment-open-question__wrapper">
            <div className="prevent-select">{data.question}</div>
            <FloatingLabelTextareaAutosize
                value={data.answer}
                onChangeHandler={onChangeHandler}
                htmlId={`open_question_${taskId}`}
                placeholder="Ответ"
                rows={5}
                noErrorField
            />
        </div>
    );
};

export default StudentAssessmentOpenQuestion;
