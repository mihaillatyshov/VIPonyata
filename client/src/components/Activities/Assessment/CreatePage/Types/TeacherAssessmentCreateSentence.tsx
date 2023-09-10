import React from "react";
import { TTeacherAssessmentCreateSentence } from "models/Activity/Items/TAssessmentItems";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";
import ITeacherAssessmentOrderTask from "./ITeacherAssessmentOrderTask";

const TeacherAssessmentCreateSentence = ({
    data,
    taskId,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentCreateSentence>) => {
    return <ITeacherAssessmentOrderTask data={data} taskId={taskId} onChangeTask={onChangeTask} isCompact={true} />;
};

export default TeacherAssessmentCreateSentence;
