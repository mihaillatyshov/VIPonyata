import React from "react";
import { TTeacherAssessmentTestSingle } from "models/Activity/Items/TAssessmentItems";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";
import InputRadioSingle from "components/Form/InputRadioSingle";

import styles from "./Style.module.css";
import TeacherAssessmentTestBase from "./TeacherAssessmentTestBase";

const TeacherAssessmentTestSingle = ({
    data,
    taskId,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentTestSingle>) => {
    const changeAnswerHandler = (id: number) => onChangeTask(taskId, { ...data, meta_answer: id });

    const removeOption = (id: number) => {
        const newOptions = [...data.options];
        newOptions.splice(id, 1);
        let newAnswer = null;
        if (data.meta_answer !== null) {
            newAnswer = data.meta_answer;
            if (data.meta_answer > id) newAnswer--;
            else if (data.meta_answer === id) newAnswer = null;
        }
        onChangeTask(taskId, { ...data, options: newOptions, meta_answer: newAnswer });
    };

    return (
        <TeacherAssessmentTestBase
            data={data}
            taskId={taskId}
            onChangeTask={onChangeTask}
            onRemoveOption={removeOption}
            selectorNode={(id: number) => (
                <InputRadioSingle
                    blockName={`${taskId}`}
                    htmlId={`${taskId}`}
                    id={id}
                    className={`input-group-text ${styles.bigCheck}`}
                    placeholder={""}
                    selectedId={data.meta_answer ?? -1}
                    onChange={changeAnswerHandler}
                />
            )}
        />
    );
};

export default TeacherAssessmentTestSingle;