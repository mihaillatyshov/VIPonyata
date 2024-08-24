import React from "react";

import { TTeacherAssessmentSentenceOrder } from "models/Activity/Items/TAssessmentItems";

import ITeacherAssessmentOrderTask from "./ITeacherAssessmentOrderTask";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";

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
