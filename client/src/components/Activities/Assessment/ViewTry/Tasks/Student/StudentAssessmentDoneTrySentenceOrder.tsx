import React from "react";

import {
    TAssessmentCheckedSentenceOrder,
    TAssessmentDoneTrySentenceOrder,
} from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

export const StudentAssessmentDoneTrySentenceOrder = ({
    data,
    checks,
}: AssessmentDoneTryTaskBaseProps<TAssessmentDoneTrySentenceOrder, TAssessmentCheckedSentenceOrder>) => {
    const getClassName = (id: number) => {
        return `student-assessment-view-sortable-order__item ${checks.mistake_parts.includes(id) ? "wrong" : "good"}`;
    };

    const rowClassName = `row mt-0 row-cols-1 mx-auto ${checks.mistakes_count > 0 ? "row-cols-sm-2 g-4" : ""}`;

    return (
        <div className={rowClassName}>
            <div className="student-assessment-sortable-order vertical">
                {data.parts.map((item, id) => (
                    <div key={id} className={getClassName(id)}>
                        {item}
                    </div>
                ))}
            </div>
            {checks.mistakes_count > 0 && (
                <div className="student-assessment-sortable-order vertical">
                    {data.meta_parts.map((item, id) => (
                        <div key={id} className="student-assessment-view-sortable-order__item good">
                            {item}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
