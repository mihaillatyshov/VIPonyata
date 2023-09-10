import React from "react";
import { TTeacherAssessmentSentenceOrder } from "models/Activity/Items/TAssessmentItems";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";
import ITeacherAssessmentOrderTask from "./ITeacherAssessmentOrderTask";

const TeacherAssessmentSentenceOrder = ({
    data,
    taskId,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentSentenceOrder>) => {
    return <ITeacherAssessmentOrderTask data={data} taskId={taskId} onChangeTask={onChangeTask} isCompact={false} />;
};

export default TeacherAssessmentSentenceOrder;
