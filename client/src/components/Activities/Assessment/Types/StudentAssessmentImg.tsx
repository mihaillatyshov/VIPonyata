import React from "react";
import ReactMarkdown from "react-markdown";

import { TAssessmentImg } from "models/Activity/Items/TAssessmentItems";

import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentImg = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentImg>) => {
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

export default StudentAssessmentImg;
