import React from "react";
import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";
import { TAssessmentFillSpacesByHand } from "models/Activity/Items/TAssessmentItems";

const StudentAssessmentFillSpacesByHand = ({
    data,
    taskId,
}: StudentAssessmentTypeProps<TAssessmentFillSpacesByHand>) => {
    const dispatch = useAppDispatch();

    const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>, fieldId: number) => {
        console.log(e.target.value);
        data.answers[fieldId] = e.target.value;
        // TODO Add message to server
        dispatch(setAssessmentTaskData({ id: taskId, data: data }));
    };

    return (
        <div>
            <div className="d-flex">
                {data.separates.map((element: string, i: number) => (
                    <div key={i} className="d-flex">
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
    );
};

export default StudentAssessmentFillSpacesByHand;
