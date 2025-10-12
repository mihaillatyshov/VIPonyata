import React from "react";

import { ReactMarkdownWithHtml } from "components/Common/ReactMarkdownWithHtml";
import { FloatingLabelTextareaAutosize } from "components/Form/FloatingLabelTextareaAutosize";
import { TTeacherAssessmentOpenQuestion } from "models/Activity/Items/TAssessmentItems";

import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";

const TeacherAssessmentOpenQuestion = ({
    data,
    taskUUID,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentOpenQuestion>) => {
    return (
        <>
            <FloatingLabelTextareaAutosize
                htmlId={`question_${taskUUID}`}
                placeholder="Вопрос"
                value={data.question}
                onChangeHandler={(newValue: string) => onChangeTask({ ...data, question: newValue })}
                rows={6}
                noErrorField={true}
                autoFocus={true}
            />

            <div className="mt-3 mb-2 md-last-pad-zero">
                <ReactMarkdownWithHtml>{data.question}</ReactMarkdownWithHtml>
            </div>
            <FloatingLabelTextareaAutosize
                htmlId={`answer_${taskUUID}`}
                placeholder="Ответ"
                value={data.meta_answer === null ? "" : data.meta_answer}
                onChangeHandler={(newValue) => onChangeTask({ ...data, meta_answer: newValue })}
                rows={5}
                noErrorField={true}
            />
        </>
    );
};

export default TeacherAssessmentOpenQuestion;
