import React from "react";
import { TTeacherAssessmentTestMulti } from "models/Activity/Items/TAssessmentItems";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";
import InputCheckSingle from "components/Form/InputCheckSingle";

import styles from "./Style.module.css";
import TeacherAssessmentTestBase from "./TeacherAssessmentTestBase";

const TeacherAssessmentTestMulti = ({
    data,
    taskUUID,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentTestMulti>) => {
    const changeAnswerHandler = (id: number) => {
        const newAnswers = [...data.meta_answers];
        if (newAnswers.includes(id)) newAnswers.splice(newAnswers.indexOf(id), 1);
        else newAnswers.push(id);
        onChangeTask({ ...data, meta_answers: newAnswers });
    };

    const removeOption = (id: number) => {
        const newOptions = [...data.options];
        newOptions.splice(id, 1);

        let newAnswers = [...data.meta_answers];
        if (newAnswers.includes(id)) newAnswers.splice(newAnswers.indexOf(id), 1);
        newAnswers = newAnswers.map((answer) => (answer > id ? answer - 1 : answer));

        onChangeTask({ ...data, options: newOptions, meta_answers: newAnswers });
    };

    return (
        <TeacherAssessmentTestBase
            data={data}
            taskUUID={taskUUID}
            onChangeTask={onChangeTask}
            onRemoveOption={removeOption}
            selectorNode={(id: number) => (
                <InputCheckSingle
                    blockName={taskUUID}
                    htmlId={taskUUID}
                    id={id}
                    className={`input-group-text ${styles.bigCheck}`}
                    placeholder={""}
                    selectedIds={data.meta_answers}
                    onChange={changeAnswerHandler}
                />
            )}
        />
    );
};

export default TeacherAssessmentTestMulti;
