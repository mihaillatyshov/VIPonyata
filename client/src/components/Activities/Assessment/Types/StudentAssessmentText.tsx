import React from "react";
import ReactMarkdown from "react-markdown";

import { TAssessmentText } from "models/Activity/Items/TAssessmentItems";

import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentText = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentText>) => {
    return (
        <div className="prevent-select md-last-pad-zero">
            <ReactMarkdown>{data.text}</ReactMarkdown>
        </div>
    );
};

export default StudentAssessmentText;
