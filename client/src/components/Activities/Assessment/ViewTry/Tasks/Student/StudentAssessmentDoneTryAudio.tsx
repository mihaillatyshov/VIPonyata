import React from "react";

import { TAssessmentAudio, TAssessmentCheckedAudio } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

export const StudentAssessmentDoneTryAudio = ({
    data,
}: AssessmentDoneTryTaskBaseProps<TAssessmentAudio, TAssessmentCheckedAudio>) => {
    return (
        <div className="w-100 mx-auto" style={{ maxWidth: "480px" }}>
            <audio className="w-100 mt-2" controls>
                <source src={data.url} type="audio/mpeg"></source>
                Your browser does not support the audio.
            </audio>
        </div>
    );
};
