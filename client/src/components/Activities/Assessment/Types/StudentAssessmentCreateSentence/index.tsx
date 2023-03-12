import React from "react";
import { StudentAssessmentTypeProps } from "../StudentAssessmentTypeProps";

const StudentAssessmentCreateSentence = ({ data, taskId }: StudentAssessmentTypeProps) => {
    return (
        <div>
            {data.parts.map((part: string, i: number) => (
                <div className="d-inline-flex mx-2" key={i} style={{}}>
                    {part}
                </div>
            ))}
        </div>
    );
};

export default StudentAssessmentCreateSentence;
