import React from "react";
import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";
import { TAssessmentSentenceOrder } from "models/Activity/Items/TAssessmentItems";
import MoveDragAndDrop from "./MoveDragAndDrop";

const StudentAssessmentSentenceOrder = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentSentenceOrder>) => {
    return <MoveDragAndDrop data={data} taskId={taskId} flexType="column" />;
};

export default StudentAssessmentSentenceOrder;
