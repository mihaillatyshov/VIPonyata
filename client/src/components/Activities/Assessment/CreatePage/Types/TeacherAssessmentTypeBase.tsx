import React from "react";

import { PyError } from "libs/PyError";
import {
    assessmentTaskRusNameAliases,
    TAssessmentItemBase,
    TAssessmentTaskName,
} from "models/Activity/Items/TAssessmentItems";

export interface TeacherAssessmentTypeProps<T extends TAssessmentItemBase> {
    data: T;
    onChangeTask: (data: T) => void;
    taskUUID: string;
}

interface TeacherAssessmentTypeBaseProps {
    taskName: TAssessmentTaskName;
    removeTask: () => void;
    children: React.ReactNode;
    errors?: PyError[];
}

const TeacherAssessmentTypeBase = ({ taskName, removeTask, children, errors }: TeacherAssessmentTypeBaseProps) => {
    return (
        <div className="my-card">
            <div className="my-card-header">
                <div className="my-card-header-title">{assessmentTaskRusNameAliases[taskName]}</div>
                <div className="ms-auto">
                    <i
                        className="bi bi-x font-icon-height-0 font-icon-button-danger"
                        style={{ fontSize: "2em" }}
                        onClick={() => removeTask()}
                    />
                </div>
            </div>
            <div className="my-card-body">
                {children}
                <div className={errors !== undefined ? "mt-3" : ""}>
                    {errors?.map((error, i) => (
                        <div key={i} className="text-danger">
                            {error.msg}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TeacherAssessmentTypeBase;
