import React from "react";
import { TAssessmentTestMulti } from "models/Activity/Items/TAssessmentItems";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";
import InputCheckSingle from "components/Form/InputCheckSingle";

import styles from "./Style.module.css";
import TeacherAssessmentTestBase from "./TeacherAssessmentTestBase";

const TeacherAssessmentTestMulti = ({
    data,
    taskId,
    onChangeTask,
}: TeacherAssessmentTypeProps<TAssessmentTestMulti>) => {
    const changeAnswerHandler = (id: number) => {
        const newAnswers = [...data.answers];
        if (newAnswers.includes(id)) newAnswers.splice(newAnswers.indexOf(id), 1);
        else newAnswers.push(id);
        onChangeTask(taskId, { ...data, answers: newAnswers });
    };

    const removeOption = (id: number) => {
        const newOptions = [...data.options];
        newOptions.splice(id, 1);

        let newAnswers = [...data.answers];
        if (newAnswers.includes(id)) newAnswers.splice(newAnswers.indexOf(id), 1);
        newAnswers = newAnswers.map((answer) => (answer > id ? answer - 1 : answer));

        onChangeTask(taskId, { ...data, options: newOptions, answers: newAnswers });
    };

    return (
        <TeacherAssessmentTestBase
            data={data}
            taskId={taskId}
            onChangeTask={onChangeTask}
            onRemoveOption={removeOption}
            selectorNode={(id: number) => (
                <InputCheckSingle
                    blockName={`${taskId}`}
                    htmlId={`${taskId}`}
                    id={id}
                    className={styles.bigCheck}
                    placeholder={""}
                    selectedIds={data.answers}
                    onChange={changeAnswerHandler}
                />
            )}
        />
    );
};

export default TeacherAssessmentTestMulti;
