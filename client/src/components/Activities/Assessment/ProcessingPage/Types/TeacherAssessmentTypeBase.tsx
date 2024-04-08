import React from "react";

import { fixPyErrorMessage, PyError } from "libs/PyError";
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
    moveDown: () => void;
    moveUp: () => void;
    removeTask: () => void;
    children: React.ReactNode;
    error?: PyError;
}

const TeacherAssessmentTypeBase = ({
    taskName,
    moveDown,
    moveUp,
    removeTask,
    children,
    error,
}: TeacherAssessmentTypeBaseProps) => {
    return (
        <div className="my-card">
            <div className="my-card-header">
                <div className="my-card-header-title">{assessmentTaskRusNameAliases[taskName]}</div>
                <div className="ms-auto d-flex gap-3 justify-content-center align-items-center">
                    <div className="d-flex gap-2">
                        <i
                            className="bi bi-arrow-down-circle font-icon-height-0 font-icon-button"
                            style={{ fontSize: "1.8em" }}
                            onClick={() => moveDown()}
                        />
                        <i
                            className="bi bi-arrow-up-circle font-icon-height-0 font-icon-button"
                            style={{ fontSize: "1.8em" }}
                            onClick={() => moveUp()}
                        />
                    </div>
                    <i
                        className="bi bi-x font-icon-height-0 font-icon-button-danger"
                        style={{ fontSize: "2em" }}
                        onClick={() => removeTask()}
                    />
                </div>
            </div>
            <div className="my-card-body">
                {children}
                <div className={error !== undefined ? "mt-3" : ""}>
                    <div className="text-danger">
                        {fixPyErrorMessage(error !== undefined ? error.message || "" : "")}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherAssessmentTypeBase;
