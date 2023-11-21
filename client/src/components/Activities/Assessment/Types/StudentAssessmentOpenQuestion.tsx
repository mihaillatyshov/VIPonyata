import React, { useRef } from "react";

import useAutosizeTextArea from "libs/useAutosizeTextArea";
import { TAssessmentOpenQuestion } from "models/Activity/Items/TAssessmentItems";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";

import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentOpenQuestion = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentOpenQuestion>) => {
    const dispatch = useAppDispatch();

    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    useAutosizeTextArea(textAreaRef.current, data.answer);

    const onChangeHandler = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        data.answer = e.target.value;
        dispatch(setAssessmentTaskData({ id: taskId, data: data }));
    };

    return (
        <div>
            <div className="prevent-select">{data.question}</div>
            <div>
                <textarea
                    className="form-control mt-2"
                    ref={textAreaRef}
                    value={data.answer}
                    onChange={onChangeHandler}
                    style={{ resize: "none" }}
                />
            </div>
        </div>
    );
};

export default StudentAssessmentOpenQuestion;
