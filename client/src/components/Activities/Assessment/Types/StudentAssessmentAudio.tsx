import React from "react";

import { TAssessmentAudio } from "models/Activity/Items/TAssessmentItems";

import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentAudio = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentAudio>) => {
    return (
        <div>
            <audio controls>
                <source src={data.url} type="audio/mpeg"></source>
                Your browser does not support the audio.
            </audio>
        </div>
    );
};

export default StudentAssessmentAudio;
