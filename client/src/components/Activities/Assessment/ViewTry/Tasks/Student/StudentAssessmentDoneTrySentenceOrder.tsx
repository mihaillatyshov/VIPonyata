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
        return `dnd__sortable-item d-flex justify-content-center ${
            checks.mistake_parts.includes(id) ? "wrong" : "good"
        }`;
    };

    const rowClassName = `mt-2 row row-cols-1 ${checks.mistakes_count > 0 ? "row-cols-sm-2 g-4" : ""}`;

    return (
        <div className={rowClassName}>
            <div className="d-flex mx-auto flex-column gap-3">
                {data.parts.map((item, id) => (
                    <div key={id} className={getClassName(id)}>
                        {item}
                    </div>
                ))}
            </div>
            {checks.mistakes_count > 0 && (
                <div className="d-flex mx-auto flex-column gap-3">
                    {data.meta_parts.map((item, id) => (
                        <div key={id} className="dnd__sortable-item d-flex justify-content-center good">
                            {item}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
