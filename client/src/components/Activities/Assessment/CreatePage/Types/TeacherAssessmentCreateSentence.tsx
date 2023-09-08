import React from "react";
import { TAssessmentCreateSentence } from "models/Activity/Items/TAssessmentItems";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";

const TeacherAssessmentCreateSentence = ({
    data,
    taskId,
    onChangeTask,
}: TeacherAssessmentTypeProps<TAssessmentCreateSentence>) => {
    const onTextChange = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
        const newParts = data.parts;
        newParts[id] = e.target.value;
        onChangeTask(taskId, { ...data, parts: newParts });
    };

    const addLine = () => {
        onChangeTask(taskId, { ...data, parts: [...data.parts, ""] });
    };

    const removeLine = (id: number) => {
        const newParts = [...data.parts];
        newParts.splice(id, 1);
        onChangeTask(taskId, { ...data, parts: newParts });
    };

    // TODO: Make it better!!!
    return (
        <div>
            {data.parts.map((item, i) => (
                <div className="d-flex mb-3" key={i}>
                    <div className="flex-grow-1">
                        <input type="text" className="form-control" value={item} onChange={(e) => onTextChange(e, i)} />
                    </div>
                    <div className="flex-shrink-1">
                        <i
                            className="bi bi-x font-icon-height-0 font-icon-button-danger ms-1"
                            style={{ fontSize: "2.2em" }}
                            onClick={() => removeLine(i)}
                        />
                    </div>
                </div>
            ))}

            <div className="d-flex justify-content-center mt-3">
                <button className="btn btn-outline-dark btn-sm d-flex" onClick={addLine}>
                    <i className="bi bi-plus-lg" />
                    Добавить слово
                </button>
            </div>
        </div>
    );
};

export default TeacherAssessmentCreateSentence;
