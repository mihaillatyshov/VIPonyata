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
    const isBlockBoundaryTask =
        taskName === TAssessmentTaskName.BLOCK_BEGIN || taskName === TAssessmentTaskName.BLOCK_END;

    return (
        <div className="my-card teacher-assessment-card">
            <div className={`my-card-header ${isBlockBoundaryTask ? "teacher-assessment-card__block-header" : ""}`}>
                <div
                    className={`my-card-header-title ${
                        isBlockBoundaryTask ? "teacher-assessment-card__block-title" : ""
                    }`}
                >
                    {assessmentTaskRusNameAliases[taskName]}
                </div>
                <div className="ms-auto d-flex gap-3 justify-content-center align-items-center">
                    <div className="d-flex gap-2">
                        <i
                            className="bi bi-arrow-down font-icon-height-0 font-icon-button teacher-assessment-card__control-icon"
                            onClick={() => moveDown()}
                        />
                        <i
                            className="bi bi-arrow-up font-icon-height-0 font-icon-button teacher-assessment-card__control-icon"
                            onClick={() => moveUp()}
                        />
                    </div>
                    <i
                        className="bi bi-x font-icon-height-0 font-icon-button-danger teacher-assessment-card__control-icon teacher-assessment-card__control-icon--danger"
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
