import React from "react";
import { TAssessmentTestSingle } from "models/Activity/Items/TAssessmentItems";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";
import InputRadioSingle from "components/Form/InputRadioSingle";

import styles from "./Style.module.css";
import TeacherAssessmentTestBase from "./TeacherAssessmentTestBase";

const TeacherAssessmentTestSingle = ({
    data,
    taskId,
    onChangeTask,
}: TeacherAssessmentTypeProps<TAssessmentTestSingle>) => {
    const changeAnswerHandler = (id: number) => onChangeTask(taskId, { ...data, answer: id });

    const removeOption = (id: number) => {
        const newOptions = [...data.options];
        newOptions.splice(id, 1);
        let newAnswer = null;
        if (data.answer !== null) {
            newAnswer = data.answer;
            if (data.answer > id) newAnswer--;
            else if (data.answer === id) newAnswer = null;
        }
        onChangeTask(taskId, { ...data, options: newOptions, answer: newAnswer });
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
                    className={styles.bigCheck}
                    placeholder={""}
                    selectedId={data.answer ?? -1}
                    onChange={changeAnswerHandler}
                />
            )}
        />
    );
};

export default TeacherAssessmentTestSingle;
