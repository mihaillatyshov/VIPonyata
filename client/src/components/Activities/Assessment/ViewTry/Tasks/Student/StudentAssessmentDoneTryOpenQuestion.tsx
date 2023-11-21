import React from "react";

import { TAssessmentCheckedOpenQuestion, TAssessmentOpenQuestion } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

export const StudentAssessmentDoneTryOpenQuestion = ({
    data,
    checks,
}: AssessmentDoneTryTaskBaseProps<TAssessmentOpenQuestion, TAssessmentCheckedOpenQuestion>) => {
    const className = `form-control mt-2 ${checks.cheked && checks.mistakes_count > 0 ? "input-wrong" : ""}`;
    return (
        <div className="mt-2">
            <div className="prevent-select">{data.question}</div>
            <div>
                <span className={className}>{data.answer} &nbsp;</span>
            </div>
        </div>
    );
};
