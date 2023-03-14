import React from "react";
import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";
import { TAssessmentOpenQuestion } from "models/Activity/Items/TAssessmentItems";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";

const StudentAssessmentOpenQuestion = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentOpenQuestion>) => {
    const dispatch = useAppDispatch();

    const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log(e.target.value);
        data.answer = e.target.value;
        // TODO Add message to server
        dispatch(setAssessmentTaskData({ id: taskId, data: data }));
    };

    return (
        <div>
            <div>{data.question}</div>
            <div>
                <input type="text" value={data.answer} onChange={onChangeHandler} />
            </div>
        </div>
    );
};

export default StudentAssessmentOpenQuestion;
