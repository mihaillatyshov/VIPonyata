import React from "react";

import InputRadioSingle from "components/Form/InputRadioSingle";
import { TAssessmentCheckedTestSingle, TAssessmentTestSingle } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

interface StudentAssessmentDoneTryTestTaskItemProps {
    option: string;
    selectedAnswer: number | null;
    isValid: boolean;
    taskId: number;
    fieldId: number;
}

const StudentAssessmentDoneTryTestTaskItem = ({
    option,
    selectedAnswer,
    isValid,
    taskId,
    fieldId,
}: StudentAssessmentDoneTryTestTaskItemProps) => {
    return (
        <div key={fieldId} className="input-group mt-1">
            <InputRadioSingle
                key={fieldId}
                htmlId={`radio_${taskId}_${fieldId}`}
                id={fieldId}
                className={`input-group-text big-check ${isValid ? "" : "check-wrong"}`}
                placeholder={""}
                selectedId={selectedAnswer ?? -1}
                isDisabled={true}
                onChange={() => {}}
            />
            <span className={`form-control prevent-select ${isValid ? "" : "input-wrong"}`}>{option}</span>
        </div>
    );
};

export const StudentAssessmentDoneTryTestSingle = ({
    data,
    checks,
    taskId,
}: AssessmentDoneTryTaskBaseProps<TAssessmentTestSingle, TAssessmentCheckedTestSingle>) => {
    return (
        <div>
            {checks.mistakes_count > 0 && checks.mistake_answer === null && (
                <div className="text-danger">Ответ не выбран</div>
            )}
            {data.options.map((option, fieldId) => (
                <StudentAssessmentDoneTryTestTaskItem
                    key={fieldId}
                    option={option}
                    selectedAnswer={data.answer}
                    fieldId={fieldId}
                    taskId={taskId}
                    isValid={checks.mistake_answer !== fieldId}
                />
            ))}
        </div>
    );
};
