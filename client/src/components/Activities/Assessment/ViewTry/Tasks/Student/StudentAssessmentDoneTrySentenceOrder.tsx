import React from "react";

import { TAssessmentCheckedSentenceOrder, TAssessmentSentenceOrder } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

export const StudentAssessmentDoneTrySentenceOrder = ({
    data,
    checks,
}: AssessmentDoneTryTaskBaseProps<TAssessmentSentenceOrder, TAssessmentCheckedSentenceOrder>) => {
    const getClassName = (id: number) => {
        return `dnd__sortable-item d-flex justify-content-center ${checks.mistake_parts.includes(id) ? "wrong" : ""}`;
    };

    return (
        <div className="d-flex mx-auto flex-column gap-3 mt-2">
            {data.parts.map((item, id) => (
                <div key={id} className={getClassName(id)}>
                    {item}
                </div>
            ))}
        </div>
    );
};
