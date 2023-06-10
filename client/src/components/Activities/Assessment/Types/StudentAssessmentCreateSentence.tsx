import React from "react";
import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";
import { TAssessmentCreateSentence } from "models/Activity/Items/TAssessmentItems";
import MoveDragAndDrop from "./MoveDragAndDrop";

const StudentAssessmentCreateSentence = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentCreateSentence>) => {
    return <MoveDragAndDrop data={data} taskId={taskId} flexType="row" />;
};

export default StudentAssessmentCreateSentence;
