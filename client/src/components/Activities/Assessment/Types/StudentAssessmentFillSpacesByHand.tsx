import React from "react";

import { ReactMarkdownWithHtml } from "components/Common/ReactMarkdownWithHtml";
import AutosizeInput from "libs/AutosizeInput";
import { TAssessmentFillSpacesByHand } from "models/Activity/Items/TAssessmentItems";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";

import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentFillSpacesByHand = ({
    data,
    taskId,
}: StudentAssessmentTypeProps<TAssessmentFillSpacesByHand>) => {
    const dispatch = useAppDispatch();

    const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>, fieldId: number) => {
        data.answers[fieldId] = e.target.value;
        dispatch(setAssessmentTaskData({ id: taskId, data: data }));
    };

    return (
        <div className="student-assessment-fill-spaces">
            {data.separates.map((element: string, i: number) => (
                <React.Fragment key={i}>
                    <div className="prevent-select md-last-no-margin">
                        <ReactMarkdownWithHtml>{element}</ReactMarkdownWithHtml>
                    </div>
                    {i < data.separates.length - 1 && (
                        <AutosizeInput
                            value={data.answers[i]}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeHandler(e, i)}
                            inputClassName="form-control student-assessment-fill-spaces-by-hand__input"
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

export default StudentAssessmentFillSpacesByHand;
