import React from "react";
import ReactMarkdown from "react-markdown";

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
        <div className="w-100 flex flex-column">
            <FloatingLabelTextareaAutosize
                htmlId={taskUUID}
                placeholder="Текст"
                value={data.text}
                onChangeHandler={changeTextHandler}
                rows={6}
                autoFocus={true}
                noErrorField={true}
            />
            <div className="mt-2 md-last-pad-zero">
                <ReactMarkdown>{data.text}</ReactMarkdown>
            </div>
        </div>
    );
};

export default TeacherAssessmentText;
