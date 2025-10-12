import React from "react";

import { ReactMarkdownWithHtml } from "components/Common/ReactMarkdownWithHtml";
import { TAssessmentCheckedText, TAssessmentText } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

export const StudentAssessmentDoneTryText = ({
    data,
}: AssessmentDoneTryTaskBaseProps<TAssessmentText, TAssessmentCheckedText>) => {
    return (
        <div className="prevent-select md-last-pad-zero">
            <ReactMarkdownWithHtml>{data.text}</ReactMarkdownWithHtml>
        </div>
    );
};
