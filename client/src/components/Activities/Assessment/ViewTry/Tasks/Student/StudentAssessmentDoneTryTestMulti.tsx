import React from "react";

import InputCheckSingle from "components/Form/InputCheckSingle";
import { TAssessmentCheckedTestMulti, TAssessmentDoneTryTestMulti } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps, TValidationStr } from "../AssessmentDoneTryTaskBase";

interface StudentAssessmentDoneTryTestTaskItemProps {
    option: string;
    selectedAnswers: number[];
    validationStr: TValidationStr;
    taskId: number;
    fieldId: number;
}

const StudentAssessmentDoneTryTestTaskItem = ({
    option,
    selectedAnswers,
    validationStr,
    taskId,
    fieldId,
}: StudentAssessmentDoneTryTestTaskItemProps) => {
    const validationCheckClassName = validationStr ? `check-${validationStr}` : "";
    const validationTextClassName = validationStr ? `input-${validationStr}` : "";

    return (
        <div key={fieldId} className="input-group mt-1">
            <InputCheckSingle
                key={fieldId}
                htmlId={`radio_${taskId}_${fieldId}`}
                id={fieldId}
                className={`input-group-text big-check ${validationCheckClassName}`}
                placeholder={""}
                selectedIds={selectedAnswers}
                isDisabled={true}
                onChange={() => {}}
            />
            <span className={`form-control prevent-select ${validationTextClassName}`}>{option}</span>
        </div>
    );
};

export const StudentAssessmentDoneTryTestMulti = ({
    data,
    checks,
    taskId,
}: AssessmentDoneTryTaskBaseProps<TAssessmentDoneTryTestMulti, TAssessmentCheckedTestMulti>) => {
    const getValidationStr = (fieldId: number): TValidationStr => {
        if (checks.mistake_answers.includes(fieldId)) {
            return "wrong";
        }
        if (data.meta_answers.includes(fieldId)) {
            return "good";
        }
    };

    return (
        <div>
            {data.options.map((option, fieldId) => (
                <StudentAssessmentDoneTryTestTaskItem
                    key={fieldId}
                    option={option}
                    selectedAnswers={data.answers}
                    fieldId={fieldId}
                    taskId={taskId}
                    validationStr={getValidationStr(fieldId)}
                />
            ))}
        </div>
    );
};
