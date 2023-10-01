import React from "react";
import { TTeacherAssessmentClassification } from "models/Activity/Items/TAssessmentItems";
import { TeacherAssessmentTypeProps } from "../TeacherAssessmentTypeBase";
import { default as Column } from "./TeacherAssessmentClassificationColumn";

const TeacherAssessmentClassification = ({
    data,
    taskUUID,
    onChangeTask,
}: TeacherAssessmentTypeProps<TTeacherAssessmentClassification>) => {
    const addColumn = () => {
        onChangeTask({ ...data, titles: [...data.titles, ""], meta_answers: [...data.meta_answers, []] });
    };

    const onTitleChangeHandler = (newValue: string, colId: number) => {
        const newTitles = [...data.titles];
        newTitles.splice(colId, 1, newValue);
        onChangeTask({ ...data, titles: newTitles });
    };

    const onAnswerChangeHandler = (newValue: string, colId: number, rowId: number) => {
        const newAnswers = [...data.meta_answers];
        newAnswers[colId].splice(rowId, 1, newValue);
        onChangeTask({ ...data, meta_answers: newAnswers });
    };

    const addRow = (colId: number) => {
        const newAnswers = [...data.meta_answers];
        newAnswers[colId] = [...newAnswers[colId], ""];
        onChangeTask({ ...data, meta_answers: newAnswers });
    };

    const removeCol = (colId: number) => {
        const newTitles = [...data.titles];
        const newAnswers = [...data.meta_answers];
        newTitles.splice(colId, 1);
        newAnswers.splice(colId, 1);
        onChangeTask({ ...data, titles: newTitles, meta_answers: newAnswers });
    };

    const removeRow = (colId: number, rowId: number) => {
        const newAnswers = [...data.meta_answers];
        newAnswers[colId].splice(rowId, 1);
        onChangeTask({ ...data, meta_answers: newAnswers });
    };

    return (
        <div>
            <div>
                <div className="d-flex justify-content-center mb-3">
                    <button className="btn btn-outline-dark btn-sm d-flex" onClick={addColumn}>
                        <i className="bi bi-plus-lg" />
                        Добавить колонку
                    </button>
                </div>
            </div>
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-3">
                {data.titles.map((title, i) => (
                    <Column
                        key={i}
                        title={title}
                        colId={i}
                        fields={data.meta_answers[i]}
                        onTitleChange={onTitleChangeHandler}
                        onAnswerChange={onAnswerChangeHandler}
                        addRow={addRow}
                        removeCol={removeCol}
                        removeRow={removeRow}
                    />
                ))}
            </div>
        </div>
    );
};

export default TeacherAssessmentClassification;
