import React from "react";

import {
    TAssessmentCheckedFillSpacesByHand,
    TAssessmentCheckedFillSpacesExists,
    TAssessmentDoneTryFillSpacesByHand,
    TAssessmentDoneTryFillSpacesExists,
} from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

export const IStudentAssessmentDoneTryFillSpaces = ({
    data,
    checks,
}:
    | AssessmentDoneTryTaskBaseProps<TAssessmentDoneTryFillSpacesByHand, TAssessmentCheckedFillSpacesByHand>
    | AssessmentDoneTryTaskBaseProps<TAssessmentDoneTryFillSpacesExists, TAssessmentCheckedFillSpacesExists>) => {
    const getClassName = (i: number) => {
        return `form-control student-assessment-fill-spaces-by-hand__input 
                ${checks.mistake_answers.includes(i) ? "wrong" : "good"}`;
    };

    return (
        <div className="d-flex flex-wrap align-items-center mt-2">
            {data.separates.map((element: string, i: number) => (
                <React.Fragment key={i}>
                    <div className="prevent-select me-2 mt-1">{element}</div>
                    {i < data.separates.length - 1 && (
                        <div className="me-2 mt-1 d-flex">
                            <span className={getClassName(i)}>{data.answers[i]}</span>
                            {checks.mistake_answers.includes(i) && (
                                <span className="form-control student-assessment-fill-spaces-by-hand__input wrong-good">
                                    {data.meta_answers[i]}
                                </span>
                            )}
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
