import React from "react";

import InputRadioSingle from "components/Form/InputRadioSingle";
import { TAssessmentCheckedTestSingle, TAssessmentDoneTryTestSingle } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps, TValidationStr } from "../AssessmentDoneTryTaskBase";

interface StudentAssessmentDoneTryTestTaskItemProps {
    option: string;
    selectedAnswer: number | null;
    validationStr: TValidationStr;
    taskId: number;
    fieldId: number;
}

const StudentAssessmentDoneTryTestTaskItem = ({
    option,
    selectedAnswer,
    validationStr,
    taskId,
    fieldId,
}: StudentAssessmentDoneTryTestTaskItemProps) => {
    const validationCheckClassName = validationStr ? `check-${validationStr}` : "";
    const validationTextClassName = validationStr ? `input-${validationStr}` : "";

    return (
        <div key={fieldId} className="input-group">
            <InputRadioSingle
                key={fieldId}
                htmlId={`radio_${taskId}_${fieldId}`}
                id={fieldId}
                className={`input-group-text big-check ${validationCheckClassName}`}
                placeholder={""}
                selectedId={selectedAnswer ?? -1}
                isDisabled={true}
                onChange={() => {}}
            />
            <span className={`form-control prevent-select ${validationTextClassName}`}>{option}</span>
        </div>
    );
};

export const StudentAssessmentDoneTryTestSingle = ({
    data,
    checks,
    taskId,
}: AssessmentDoneTryTaskBaseProps<TAssessmentDoneTryTestSingle, TAssessmentCheckedTestSingle>) => {
    const getValidationStr = (fieldId: number): TValidationStr => {
        if (checks.mistake_answer === fieldId || (checks.mistakes_count > 0 && data.meta_answer === fieldId)) {
            return "wrong";
        }
        if (data.meta_answer === fieldId && data.answer === data.meta_answer) {
            return "good";
        }
    };

    return (
        <>
            {checks.mistakes_count > 0 && checks.mistake_answer === null && (
                <div className="text-danger">Ответ не выбран</div>
            )}

            <div className="student-assessment-test">
                <div className="prevent-select">{data.question}</div>

                <div className="student-assessment-test__options">
                    {data.options.map((option, fieldId) => (
                        <StudentAssessmentDoneTryTestTaskItem
                            key={fieldId}
                            option={option}
                            selectedAnswer={data.answer}
                            fieldId={fieldId}
                            taskId={taskId}
                            validationStr={getValidationStr(fieldId)}
                        />
                    ))}
                </div>
            </div>
        </>
    );
};
