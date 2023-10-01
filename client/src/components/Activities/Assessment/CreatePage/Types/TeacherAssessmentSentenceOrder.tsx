import React from "react";
import { TTeacherAssessmentSentenceOrder } from "models/Activity/Items/TAssessmentItems";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";
import ITeacherAssessmentOrderTask from "./ITeacherAssessmentOrderTask";

const TeacherAssessmentSentenceOrder = ({
    data,
    taskUUID,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentSentenceOrder>) => {
    return (
        <ITeacherAssessmentOrderTask data={data} taskUUID={taskUUID} onChangeTask={onChangeTask} isCompact={false} />
    );
};

export default TeacherAssessmentSentenceOrder;
