import React from "react";
import ReactMarkdown from "react-markdown";

import { TAssessmentAudio } from "models/Activity/Items/TAssessmentItems";

import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentAudio = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentAudio>) => {
    return (
        <div className="d-flex w-100 justify-content-center flex-column text-center gap-2">
            {data.description && (
                <div className="prevent-select md-last-pad-zero">
                    <ReactMarkdown>{data.description}</ReactMarkdown>
                </div>
            )}
            <div className="w-100 mx-auto" style={{ maxWidth: "480px" }}>
                <audio className="w-100" controls>
                    <source src={data.url} type="audio/mpeg"></source>
                    Your browser does not support the audio.
                </audio>
            </div>
        </div>
    );
};

export default StudentAssessmentAudio;
