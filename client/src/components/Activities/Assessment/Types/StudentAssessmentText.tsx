import React from "react";
import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";
import { TAssessmentText } from "models/Activity/Items/TAssessmentItems";

const StudentAssessmentText = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentText>) => {
    return <div>{data.text}</div>;
};

export default StudentAssessmentText;
