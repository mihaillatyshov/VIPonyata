import React from "react";
import { TAssessmentTaskName, TTeacherAssessmentText } from "models/Activity/Items/TAssessmentItems";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";
import InputTextArea from "components/Form/InputTextArea";

const TeacherAssessmentText = ({
    data,
    taskUUID,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentText>) => {
    const changeTextHandler = (newValue: string) => {
        onChangeTask({ name: TAssessmentTaskName.TEXT, text: newValue });
    };

    return (
        <div>
            <InputTextArea
                htmlId={taskUUID}
                placeholder="Текст"
                value={data.text}
                onChangeHandler={changeTextHandler}
                className=""
                autoFocus={true}
                noErrorField={true}
            />
        </div>
    );
};

export default TeacherAssessmentText;
