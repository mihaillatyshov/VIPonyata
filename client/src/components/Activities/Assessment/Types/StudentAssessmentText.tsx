import React from "react";

import { ReactMarkdownWithHtml } from "components/Common/ReactMarkdownWithHtml";
import { TAssessmentText } from "models/Activity/Items/TAssessmentItems";

import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentText = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentText>) => {
    return (
        <div className="prevent-select md-last-pad-zero">
            <ReactMarkdownWithHtml>{data.text}</ReactMarkdownWithHtml>
        </div>
    );
};

export default StudentAssessmentText;
