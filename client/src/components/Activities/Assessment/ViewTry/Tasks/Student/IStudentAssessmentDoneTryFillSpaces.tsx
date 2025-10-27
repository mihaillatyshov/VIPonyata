import React from "react";

import { ReactMarkdownWithHtml } from "components/Common/ReactMarkdownWithHtml";
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
        return `form-control student-assessment-fill-spaces-by-hand__input md-last-pad-zero
                ${checks.mistake_answers.includes(i) ? "wrong" : "good"}`;
    };

    return (
        <div className="student-assessment-fill-spaces">
            {data.separates.map((element: string, i: number) => (
                <React.Fragment key={i}>
                    <div className="prevent-select md-last-pad-zero">
                        <ReactMarkdownWithHtml>{element}</ReactMarkdownWithHtml>
                    </div>

                    {i < data.separates.length - 1 && (
                        <div className="d-flex">
                            <div className={getClassName(i)}>
                                <ReactMarkdownWithHtml>{data.answers[i] || "&nbsp;"}</ReactMarkdownWithHtml>
                            </div>
                            {checks.mistake_answers.includes(i) && (
                                <div className="form-control student-assessment-fill-spaces-by-hand__input wrong-good md-last-pad-zero">
                                    <ReactMarkdownWithHtml>{data.meta_answers[i]}</ReactMarkdownWithHtml>
                                </div>
                            )}
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
