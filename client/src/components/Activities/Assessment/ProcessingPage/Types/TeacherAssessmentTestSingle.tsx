import React from "react";

import InputRadioSingle from "components/Form/InputRadioSingle";
import { TTeacherAssessmentTestSingle } from "models/Activity/Items/TAssessmentItems";

import TeacherAssessmentTestBase from "./TeacherAssessmentTestBase";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";

const TeacherAssessmentTestSingle = ({
    data,
    taskUUID,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentTestSingle>) => {
    const changeAnswerHandler = (id: number) => onChangeTask({ ...data, meta_answer: id });

    const removeOption = (id: number) => {
        const newOptions = [...data.options];
        newOptions.splice(id, 1);
        let newAnswer = null;
        if (data.meta_answer !== null) {
            newAnswer = data.meta_answer;
            if (data.meta_answer > id) newAnswer--;
            else if (data.meta_answer === id) newAnswer = null;
        }
        onChangeTask({ ...data, options: newOptions, meta_answer: newAnswer });
    };

    return (
        <TeacherAssessmentTestBase
            data={data}
            taskUUID={taskUUID}
            onChangeTask={onChangeTask}
            onRemoveOption={removeOption}
            selectorNode={(id: number) => (
                <InputRadioSingle
                    htmlId={taskUUID}
                    id={id}
                    className="input-group-text big-check"
                    placeholder={""}
                    selectedId={data.meta_answer ?? -1}
                    onChange={changeAnswerHandler}
                />
            )}
        />
    );
};

export default TeacherAssessmentTestSingle;
