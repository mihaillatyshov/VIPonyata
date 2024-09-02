import React from "react";
import ReactMarkdown from "react-markdown";

import { TAssessmentCheckedText, TAssessmentText } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

export const StudentAssessmentDoneTryText = ({
    data,
}: AssessmentDoneTryTaskBaseProps<TAssessmentText, TAssessmentCheckedText>) => {
    return (
        <div className="prevent-select md-last-pad-zero">
            <ReactMarkdown>{data.text}</ReactMarkdown>
        </div>
    );
};
