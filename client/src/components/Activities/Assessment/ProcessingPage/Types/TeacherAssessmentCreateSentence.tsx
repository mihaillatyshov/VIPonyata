import React from "react";

import { TTeacherAssessmentCreateSentence } from "models/Activity/Items/TAssessmentItems";

import ITeacherAssessmentOrderTask from "./ITeacherAssessmentOrderTask";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";

const TeacherAssessmentCreateSentence = ({
    data,
    taskUUID,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentCreateSentence>) => {
    return <ITeacherAssessmentOrderTask data={data} taskUUID={taskUUID} onChangeTask={onChangeTask} isCompact={true} />;
};

export default TeacherAssessmentCreateSentence;
