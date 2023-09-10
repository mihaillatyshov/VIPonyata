import React from "react";
import { TTeacherAssessmentOpenQuestion } from "models/Activity/Items/TAssessmentItems";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";
import InputTextArea from "components/Form/InputTextArea";

const TeacherAssessmentOpenQuestion = ({
    data,
    taskId,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentOpenQuestion>) => {
    const changeTextHandler = (newValue: string) => {
        onChangeTask(taskId, { ...data, question: newValue.trim() });
    };

    return (
        <div>
            <InputTextArea
                htmlId={`${taskId}`}
                placeholder="Вопрос"
                value={data.question}
                onChangeHandler={changeTextHandler}
                className=""
                autoFocus={true}
                noErrorField={true}
            />
        </div>
    );
};

export default TeacherAssessmentOpenQuestion;
