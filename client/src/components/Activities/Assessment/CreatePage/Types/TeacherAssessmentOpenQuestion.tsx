import React from "react";

import InputText from "components/Form/InputText";
import InputTextArea from "components/Form/InputTextArea";
import { TTeacherAssessmentOpenQuestion } from "models/Activity/Items/TAssessmentItems";

import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";

const TeacherAssessmentOpenQuestion = ({
    data,
    taskUUID,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentOpenQuestion>) => {
    return (
        <div>
            <InputTextArea
                htmlId={taskUUID}
                placeholder="Вопрос"
                value={data.question}
                onChangeHandler={(newValue: string) => onChangeTask({ ...data, question: newValue })}
                className=""
                autoFocus={true}
                noErrorField={true}
            />
            <InputText
                htmlId={taskUUID}
                placeholder="Ответ"
                value={data.meta_answer}
                onChangeHandler={(newValue) => onChangeTask({ ...data, meta_answer: newValue })}
                className="mt-4"
                noErrorField={true}
            />
        </div>
    );
};

export default TeacherAssessmentOpenQuestion;
