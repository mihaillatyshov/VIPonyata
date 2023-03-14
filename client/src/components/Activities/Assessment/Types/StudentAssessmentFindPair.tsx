import React from "react";
import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";
import { TAssessmentFindPair } from "models/Activity/Items/TAssessmentItems";

const StudentAssessmentFindPair = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentFindPair>) => {
    return (
        <div className="row mx-0">
            <div className="col-auto mx-4" style={{ border: "1px solid #000000" }}>
                {data.first.map((element: string, i: number) => (
                    <div key={i}>{element}</div>
                ))}
            </div>
            <div className="col-auto mx-4" style={{ border: "1px solid #000000" }}>
                {data.second.map((element: string, i: number) => (
                    <div key={i}>{element}</div>
                ))}
            </div>
        </div>
    );
};

export default StudentAssessmentFindPair;
