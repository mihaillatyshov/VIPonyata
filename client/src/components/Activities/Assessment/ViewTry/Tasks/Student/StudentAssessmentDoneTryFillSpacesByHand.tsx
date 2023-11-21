import React from "react";

import AutosizeInput from "libs/AutosizeInput";
import {
    TAssessmentCheckedFillSpacesByHand,
    TAssessmentFillSpacesByHand,
} from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

export const StudentAssessmentDoneTryFillSpacesByHand = ({
    data,
    checks,
}: AssessmentDoneTryTaskBaseProps<TAssessmentFillSpacesByHand, TAssessmentCheckedFillSpacesByHand>) => {
    const getClassName = (i: number) => {
        return `form-control student-assessment-fill-spaces-by-hand__input me-2 mt-1 
                ${checks.mistake_answers.includes(i) ? "wrong" : ""}`;
    };

    return (
        <div className="d-flex flex-wrap align-items-center">
            {data.separates.map((element: string, i: number) => (
                <React.Fragment key={i}>
                    <div className="prevent-select me-2 mt-1">{element}</div>
                    {i < data.separates.length - 1 && (
                        <AutosizeInput
                            value={data.answers[i]}
                            onChange={() => {}}
                            disabled={true}
                            inputClassName={getClassName(i)}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
