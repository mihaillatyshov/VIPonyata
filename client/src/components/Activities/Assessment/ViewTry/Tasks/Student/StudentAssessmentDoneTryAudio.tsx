import { ReactMarkdownWithHtml } from "components/Common/ReactMarkdownWithHtml";
import { TAssessmentAudio, TAssessmentCheckedAudio } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

export const StudentAssessmentDoneTryAudio = ({
    data,
}: AssessmentDoneTryTaskBaseProps<TAssessmentAudio, TAssessmentCheckedAudio>) => {
    return (
        <div className="student-assessment-audio__wrapper">
            {data.description && (
                <div className="student-assessment-audio__description prevent-select md-last-pad-zero">
                    <ReactMarkdownWithHtml>{data.description}</ReactMarkdownWithHtml>
                </div>
            )}

            <div className="student-assessment-audio__player-wrap">
                <audio className="student-assessment-audio__player" controls preload="metadata">
                    <source src={data.url} type="audio/mpeg"></source>
                    Your browser does not support the audio.
                </audio>
            </div>
        </div>
    );
};
