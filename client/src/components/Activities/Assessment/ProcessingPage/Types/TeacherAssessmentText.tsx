import React from "react";

import { FloatingLabelTextareaAutosize } from "components/Form/FloatingLabelTextareaAutosize";
import { TAssessmentTaskName, TTeacherAssessmentText } from "models/Activity/Items/TAssessmentItems";

import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";

const TeacherAssessmentText = ({
    data,
    taskUUID,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentText>) => {
    const changeTextHandler = (newValue: string) => {
        onChangeTask({ name: TAssessmentTaskName.TEXT, text: newValue });
    };

    return (
        <FloatingLabelTextareaAutosize
            htmlId={taskUUID}
            placeholder="Текст"
            value={data.text}
            onChangeHandler={changeTextHandler}
            rows={6}
            autoFocus={true}
            noErrorField={true}
        />
    );
};

export default TeacherAssessmentText;
