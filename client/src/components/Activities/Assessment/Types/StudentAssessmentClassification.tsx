import React from "react";
import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentClassification = ({ data, taskId }: StudentAssessmentTypeProps) => {
    return (
        <div>
            <div>
                {data.data.map((element: string, i: number) => (
                    <span key={i}>{element}</span>
                ))}
            </div>
            <div className="row mx-0">
                {data.titles.map((element: string, i: number) => (
                    <div className="col-auto" key={i}>
                        {element}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentAssessmentClassification;
