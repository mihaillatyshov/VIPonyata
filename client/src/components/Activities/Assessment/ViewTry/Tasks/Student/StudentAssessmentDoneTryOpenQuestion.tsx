import React from "react";

import { TAssessmentCheckedOpenQuestion, TAssessmentDoneTryOpenQuestion } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

export const StudentAssessmentDoneTryOpenQuestion = ({
    data,
    checks,
}: AssessmentDoneTryTaskBaseProps<TAssessmentDoneTryOpenQuestion, TAssessmentCheckedOpenQuestion>) => {
    console.log("StudentAssessmentDoneTryOpenQuestion", data, checks);

    const className = `form-control mt-2 ${checks.cheked && checks.mistakes_count > 0 ? "" : "input-good"}`;
    return (
        <div className="mt-2">
            <div className="prevent-select">{data.question}</div>
            <div>
                <span className={className}>{data.answer} &nbsp;</span>
            </div>
            {data.meta_answer ? (
                <div>
                    <span className="form-control mt-2 input-good">{data.meta_answer} &nbsp;</span>
                </div>
            ) : null}
        </div>
    );
};
