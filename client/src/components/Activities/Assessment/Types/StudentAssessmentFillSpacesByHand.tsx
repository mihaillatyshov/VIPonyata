import React from "react";

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
        console.log(e.target.value);
        data.answers[fieldId] = e.target.value;
        dispatch(setAssessmentTaskData({ id: taskId, data: data }));
    };

    return (
        <div>
            <div className="d-flex">
                <div className="d-flex flex-wrap">
                    {data.separates.map((element: string, i: number) => (
                        <div key={i} className="d-flex flex-wrap">
                            <div>{element}</div>
                            {i < data.separates.length - 1 && (
                                <input
                                    className="mx-2"
                                    style={{ height: "1.5rem" }}
                                    type="text"
                                    value={data.answers[i]}
                                    onChange={(e) => onChangeHandler(e, i)}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StudentAssessmentFillSpacesByHand;
