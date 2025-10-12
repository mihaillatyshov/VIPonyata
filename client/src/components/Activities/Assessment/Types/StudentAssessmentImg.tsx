import React from "react";

import { ReactMarkdownWithHtml } from "components/Common/ReactMarkdownWithHtml";
import { TAssessmentImg } from "models/Activity/Items/TAssessmentItems";

import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentImg = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentImg>) => {
    return (
        <div className="d-flex w-100 justify-content-center flex-column text-center gap-2">
            {data.description && (
                <div className="prevent-select md-last-pad-zero">
                    <ReactMarkdownWithHtml>{data.description}</ReactMarkdownWithHtml>
                </div>
            )}
            <div>
                <img alt="Img" className="img-base" src={data.url} />
            </div>
        </div>
    );
};

export default StudentAssessmentImg;
