import React from "react";

import InputCheckSingle from "components/Form/InputCheckSingle";
import { TAssessmentCheckedTestMulti, TAssessmentTestMulti } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

interface StudentAssessmentDoneTryTestTaskItemProps {
    option: string;
    selectedAnswers: number[];
    isValid: boolean;
    taskId: number;
    fieldId: number;
}

const StudentAssessmentDoneTryTestTaskItem = ({
    option,
    selectedAnswers,
    isValid,
    taskId,
    fieldId,
}: StudentAssessmentDoneTryTestTaskItemProps) => {
    return (
        <div key={fieldId} className="input-group mt-1">
            <InputCheckSingle
                key={fieldId}
                htmlId={`radio_${taskId}_${fieldId}`}
                id={fieldId}
                className={`input-group-text big-check ${isValid ? "" : "check-wrong"}`}
                placeholder={""}
                selectedIds={selectedAnswers}
                isDisabled={true}
                onChange={() => {}}
            />
            <span className={`form-control prevent-select ${isValid ? "" : "input-wrong"}`}>{option}</span>
        </div>
    );
};

export const StudentAssessmentDoneTryTestMulti = ({
    data,
    checks,
    taskId,
}: AssessmentDoneTryTaskBaseProps<TAssessmentTestMulti, TAssessmentCheckedTestMulti>) => {
    return (
        <div>
            {/* {checks.mistakes_count > 0 && checks.mistake_answer === null && (
                <div className="text-danger">Ответ не выбран</div>
            )} */}
            {data.options.map((option, fieldId) => (
                <StudentAssessmentDoneTryTestTaskItem
                    key={fieldId}
                    option={option}
                    selectedAnswers={data.answers}
                    fieldId={fieldId}
                    taskId={taskId}
                    isValid={!checks.mistake_answers.includes(fieldId)}
                />
            ))}
        </div>
    );
};
