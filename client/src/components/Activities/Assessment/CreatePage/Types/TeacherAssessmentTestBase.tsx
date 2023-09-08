import { TAssessmentTestMulti, TAssessmentTestSingle } from "models/Activity/Items/TAssessmentItems";
import React from "react";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";
import InputTextArea from "components/Form/InputTextArea";

type TAssessmentTestType = TAssessmentTestSingle | TAssessmentTestMulti;

interface TeacherAssessmentTestBaseProps<T extends TAssessmentTestType> extends TeacherAssessmentTypeProps<T> {
    onRemoveOption: (id: number) => void;
    selectorNode: (id: number) => React.ReactNode;
}

const TeacherAssessmentTestBase = <T extends TAssessmentTestType>({
    data,
    taskId,
    onChangeTask,
    onRemoveOption,
    selectorNode,
}: TeacherAssessmentTestBaseProps<T>) => {
    const changeQuestionHandler = (newValue: string) => onChangeTask(taskId, { ...data, question: newValue });
    const addOption = () => onChangeTask(taskId, { ...data, options: [...data.options, ""] });
    const changeOptionHandler = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const newOptions = [...data.options];
        newOptions[id] = e.target.value;
        onChangeTask(taskId, { ...data, options: newOptions });
    };

    return (
        <div>
            <InputTextArea
                htmlId={`${taskId}`}
                placeholder="Вопрос"
                value={data.question}
                onChangeHandler={changeQuestionHandler}
                className="mb-3"
                noErrorField={true}
            />
            {data.options.map((option, i) => (
                <div className="d-flex mb-3" key={i}>
                    {selectorNode(i)}
                    <div className="flex-grow-1">
                        <input
                            className="w-100 form-control"
                            type="text"
                            value={option}
                            onChange={(e) => changeOptionHandler(i, e)}
                        />
                    </div>
                    <div className="flex-shrink-1">
                        <i
                            className="bi bi-x font-icon-height-0 font-icon-button-danger ms-1"
                            style={{ fontSize: "2.2em" }}
                            onClick={() => onRemoveOption(i)}
                        />
                    </div>
                </div>
            ))}
            <button className="btn btn-outline-dark btn-sm d-flex" onClick={addOption}>
                <i className="bi bi-plus-lg" />
                Добавить ответ
            </button>
        </div>
    );
};

export default TeacherAssessmentTestBase;
