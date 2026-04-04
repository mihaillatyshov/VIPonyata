import React from "react";

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
    hasValidationError?: boolean;
}

const TeacherAssessmentTypeBase = ({
    taskName,
    moveDown,
    moveUp,
    removeTask,
    children,
    hasValidationError = false,
}: TeacherAssessmentTypeBaseProps) => {
    const isBlockBoundaryTask =
        taskName === TAssessmentTaskName.BLOCK_BEGIN || taskName === TAssessmentTaskName.BLOCK_END;
    const cardClassName = [
        "my-card",
        "teacher-assessment-card",
        hasValidationError ? "teacher-assessment-card--validation-error" : "",
        taskName === TAssessmentTaskName.BLOCK_BEGIN ? "teacher-assessment-card--block-begin" : "",
        taskName === TAssessmentTaskName.BLOCK_END ? "teacher-assessment-card--block-end" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={cardClassName}>
            <div className={`my-card-header ${isBlockBoundaryTask ? "teacher-assessment-card__block-header" : ""}`}>
                <div
                    className={`my-card-header-title ${
                        isBlockBoundaryTask ? "teacher-assessment-card__block-title" : ""
                    }`}
                >
                    {hasValidationError && (
                        <i
                            className="bi bi-exclamation-circle-fill teacher-assessment-card__title-warning"
                            aria-label="Задание заполнено не полностью"
                        />
                    )}
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
            <div className="my-card-body">{children}</div>
        </div>
    );
};

export default TeacherAssessmentTypeBase;
