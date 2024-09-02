import React from "react";
import ReactMarkdown from "react-markdown";

import { TAssessmentCheckedImg, TAssessmentImg } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

export const StudentAssessmentDoneTryImg = ({
    data,
}: AssessmentDoneTryTaskBaseProps<TAssessmentImg, TAssessmentCheckedImg>) => {
    return (
        <div className="d-flex w-100 justify-content-center flex-column text-center gap-2">
            {data.description && (
                <div className="prevent-select md-last-pad-zero">
                    <ReactMarkdown>{data.description}</ReactMarkdown>
                </div>
            )}
            <div>
                <img alt="Img" className="img-base" src={data.url} />
            </div>
        </div>
    );
};
