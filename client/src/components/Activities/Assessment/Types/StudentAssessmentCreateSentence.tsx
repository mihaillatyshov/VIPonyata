import React from "react";
import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentCreateSentence = ({ data, taskId }: StudentAssessmentTypeProps) => {
    return (
        <div>
            {data.parts.map((part: string, i: number) => (
                <div key={i}>{part}</div>
            ))}
        </div>
    );
};

export default StudentAssessmentCreateSentence;
