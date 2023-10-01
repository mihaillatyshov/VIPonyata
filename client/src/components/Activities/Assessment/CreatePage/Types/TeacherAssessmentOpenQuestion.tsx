import React from "react";
import { TTeacherAssessmentOpenQuestion } from "models/Activity/Items/TAssessmentItems";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";
import InputTextArea from "components/Form/InputTextArea";

const TeacherAssessmentOpenQuestion = ({
    data,
    taskUUID,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentOpenQuestion>) => {
    const changeTextHandler = (newValue: string) => {
        onChangeTask({ ...data, question: newValue });
    };

    return (
        <div>
            <InputTextArea
                htmlId={taskUUID}
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
