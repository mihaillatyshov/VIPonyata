import { TTeacherAssessmentTestMulti, TTeacherAssessmentTestSingle } from "models/Activity/Items/TAssessmentItems";
import React from "react";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";
import InputTextArea from "components/Form/InputTextArea";

type TTeacherAssessmentTestType = TTeacherAssessmentTestSingle | TTeacherAssessmentTestMulti;

interface TeacherAssessmentTestBaseProps<T extends TTeacherAssessmentTestType> extends TeacherAssessmentTypeProps<T> {
    onRemoveOption: (id: number) => void;
    selectorNode: (id: number) => React.ReactNode;
}

const TeacherAssessmentTestBase = <T extends TTeacherAssessmentTestType>({
    data,
    taskUUID,
    onChangeTask,
    onRemoveOption,
    selectorNode,
}: TeacherAssessmentTestBaseProps<T>) => {
    const changeQuestionHandler = (newValue: string) => onChangeTask({ ...data, question: newValue });
    const addOption = () => onChangeTask({ ...data, options: [...data.options, ""] });
    const changeOptionHandler = (newValue: string, id: number) => {
        const newOptions = [...data.options];
        newOptions[id] = newValue;
        onChangeTask({ ...data, options: newOptions });
    };

    return (
        <div>
            <InputTextArea
                htmlId={taskUUID}
                placeholder="Вопрос"
                value={data.question}
                onChangeHandler={changeQuestionHandler}
                className="mb-3"
                noErrorField={true}
            />
            {data.options.map((option, i) => (
                <div key={i} className="input-group mb-3 w-auto">
                    {selectorNode(i)}
                    <input
                        type="text"
                        className="form-control"
                        value={option}
                        onChange={(e) => changeOptionHandler(e.target.value, i)}
                        autoFocus={true}
                    />
                    <span className="input-group-text w-auto p-0">
                        <i
                            className="bi bi-x font-icon-height-0 font-icon-button-danger"
                            style={{ fontSize: "2em", margin: "0 2px" }}
                            onClick={() => onRemoveOption(i)}
                        />
                    </span>
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
