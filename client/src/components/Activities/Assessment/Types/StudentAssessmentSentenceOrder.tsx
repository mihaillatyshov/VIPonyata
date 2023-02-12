import React from "react";
import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentSentenceOrder = ({ data, taskId }: StudentAssessmentTypeProps) => {
    return (
        <div>
            {data.sentences.map((element: string, i: number) => (
                <div key={i}>{element}</div>
            ))}
        </div>
    );
};

export default StudentAssessmentSentenceOrder;
