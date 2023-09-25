import React from "react";
import {
    TTeacherAssessmentCreateSentence,
    TTeacherAssessmentSentenceOrder,
} from "models/Activity/Items/TAssessmentItems";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";
import { getTextWidth } from "libs/fontSize";
import CSS from "csstype";

type TTeacherAssessmentFillSpaceType = TTeacherAssessmentCreateSentence | TTeacherAssessmentSentenceOrder;

interface InputProps {
    value: string;
    id: number;
    onChange: (newValue: string, id: number) => void;
    isCompact: boolean;
}

const Input = ({ value, id, onChange, isCompact }: InputProps) => {
    const textWidth = Math.max(
        100,
        getTextWidth(
            value,
            `bold 1rem arial system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue","Noto Sans","Liberation Sans",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"`
        ) + 50
    );
    const style: CSS.Properties = isCompact
        ? {
              minWidth: `${textWidth}px`,
              maxWidth: `${textWidth}px`,
          }
        : {};

    return (
        <input
            type="text"
            autoFocus={true}
            className="form-control"
            style={style}
            value={value}
            onChange={(e) => onChange(e.target.value, id)}
        />
    );
};

interface AddButtonProps {
    addLine: () => void;
    isCompact: boolean;
}

const AddButton = ({ addLine, isCompact }: AddButtonProps) => {
    const style: CSS.Properties = isCompact ? { fontSize: "1.5em", margin: "0 6px" } : {};
    return (
        <div className="d-mb-3">
            <button className={`btn btn-outline-dark ${isCompact ? "p-0" : ""}`} onClick={addLine}>
                <i className="bi bi-plus-lg" style={style} />
                {isCompact ? "" : "Добавить предложение"}
            </button>
        </div>
    );
};

interface ITeacherAssessmentOrderTaskProps<T extends TTeacherAssessmentFillSpaceType>
    extends TeacherAssessmentTypeProps<T> {
    isCompact: boolean;
}

const ITeacherAssessmentOrderTask = <T extends TTeacherAssessmentFillSpaceType>({
    data,
    taskId,
    onChangeTask,
    isCompact,
}: ITeacherAssessmentOrderTaskProps<T>) => {
    const onTextChange = (newValue: string, id: number) => {
        const newParts = data.meta_parts;
        newParts[id] = newValue;
        onChangeTask(taskId, { ...data, meta_parts: newParts });
    };

    const addLine = () => {
        onChangeTask(taskId, { ...data, meta_parts: [...data.meta_parts, ""] });
    };

    const removeLine = (id: number) => {
        const newParts = [...data.meta_parts];
        newParts.splice(id, 1);
        onChangeTask(taskId, { ...data, meta_parts: newParts });
    };

    const className = isCompact ? "d-flex flex-wrap" : "";

    return (
        <div className={className}>
            {data.meta_parts.map((item, i) => (
                <div key={i} className="input-group mb-3 me-3 w-auto">
                    <Input value={item} onChange={onTextChange} id={i} isCompact={isCompact} />
                    <span className="input-group-text w-auto p-0">
                        <i
                            className="bi bi-x font-icon-height-0 font-icon-button-danger ms-1"
                            style={{ fontSize: "2.2em" }}
                            onClick={() => removeLine(i)}
                        />
                    </span>
                </div>
            ))}
            <AddButton addLine={addLine} isCompact={isCompact} />
        </div>
    );
};

export default ITeacherAssessmentOrderTask;
