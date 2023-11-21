import React from "react";

import {
    TAssessmentCheckedFillSpacesExists,
    TAssessmentFillSpacesExists,
} from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

interface DroppableFieldProps {
    str: string | null;
    isWrong: boolean;
}

const DroppableField = ({ str, isWrong }: DroppableFieldProps) => {
    const className = `dnd__sortable-item d-flex flex-wrap me-2 mt-2 ${isWrong ? "wrong" : ""}`;
    return <div className={className}>{str ?? "Пусто"}</div>;
};

export const StudentAssessmentDoneTryFillSpacesExists = ({
    data,
    checks,
}: AssessmentDoneTryTaskBaseProps<TAssessmentFillSpacesExists, TAssessmentCheckedFillSpacesExists>) => {
    return (
        <div className="d-flex flex-wrap align-items-center mt-2">
            {data.separates.map((element: string, fieldId: number) => (
                <React.Fragment key={fieldId}>
                    <div className="prevent-select me-2 mt-2">{element}</div>
                    {fieldId < data.separates.length - 1 && (
                        <DroppableField
                            str={data.answers[fieldId]}
                            isWrong={checks.mistake_answers.includes(fieldId)}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
