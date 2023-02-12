import React from "react";
import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentText = ({ data, taskId }: StudentAssessmentTypeProps) => {
    return <div>{data.text}</div>;
};

export default StudentAssessmentText;
