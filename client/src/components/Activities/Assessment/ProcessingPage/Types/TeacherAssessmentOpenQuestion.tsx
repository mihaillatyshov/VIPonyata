import React from "react";

import { FloatingLabelTextareaAutosize } from "components/Form/FloatingLabelTextareaAutosize";
import { TTeacherAssessmentOpenQuestion } from "models/Activity/Items/TAssessmentItems";

import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";

const TeacherAssessmentOpenQuestion = ({
    data,
    taskUUID,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentOpenQuestion>) => {
    return (
        <div>
            <FloatingLabelTextareaAutosize
                htmlId={`question_${taskUUID}`}
                placeholder="Вопрос"
                value={data.question}
                onChangeHandler={(newValue: string) => onChangeTask({ ...data, question: newValue })}
                rows={6}
                noErrorField={true}
                autoFocus={true}
            />
            <FloatingLabelTextareaAutosize
                htmlId={`answer_${taskUUID}`}
                placeholder="Ответ"
                value={data.meta_answer === null ? "" : data.meta_answer}
                onChangeHandler={(newValue) => onChangeTask({ ...data, meta_answer: newValue })}
                className="mt-4"
                rows={5}
                noErrorField={true}
            />
        </div>
    );
};

export default TeacherAssessmentOpenQuestion;
