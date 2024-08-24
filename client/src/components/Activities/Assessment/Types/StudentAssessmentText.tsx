import React from "react";

import { TAssessmentText } from "models/Activity/Items/TAssessmentItems";

import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentText = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentText>) => {
    return <div>{data.text}</div>;
};

export default StudentAssessmentText;
