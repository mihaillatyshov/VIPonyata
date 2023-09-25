import React from "react";
import { TAssessmentTaskName, TTeacherAssessmentText } from "models/Activity/Items/TAssessmentItems";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";
import InputTextArea from "components/Form/InputTextArea";

const TeacherAssessmentText = ({ data, taskId, onChangeTask }: TeacherAssessmentTypeProps<TTeacherAssessmentText>) => {
    const changeTextHandler = (newValue: string) => {
        onChangeTask(taskId, { name: TAssessmentTaskName.TEXT, text: newValue });
    };

    return (
        <div>
            <InputTextArea
                htmlId={`${taskId}`}
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
