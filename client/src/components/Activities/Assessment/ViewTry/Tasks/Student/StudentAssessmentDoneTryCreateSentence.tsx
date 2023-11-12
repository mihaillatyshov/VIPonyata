import React from "react";

import { TAssessmentCheckedCreateSentence, TAssessmentCreateSentence } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

export const StudentAssessmentDoneTryCreateSentence = ({
    data,
    checks,
    taskId,
}: AssessmentDoneTryTaskBaseProps<TAssessmentCreateSentence, TAssessmentCheckedCreateSentence>) => {
    const getClassName = (id: number) => {
        return `dnd__sortable-item me-2 mt-2 ${checks.mistake_parts.includes(id) ? "wrong" : ""}`;
    };

    return (
        <div className="d-flex flex-wrap">
            {data.parts.map((item, id) => (
                <div key={id} className={getClassName(id)}>
                    {item}
                </div>
            ))}
        </div>
    );
};
