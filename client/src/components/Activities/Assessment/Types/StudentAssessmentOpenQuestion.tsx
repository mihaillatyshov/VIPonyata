import React from "react";
import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentOpenQuestion = ({ data, taskId }: StudentAssessmentTypeProps) => {
    return (
        <div>
            <div>{data.question}</div>
            <div>
                <input type="text" />
            </div>
        </div>
    );
};

export default StudentAssessmentOpenQuestion;
