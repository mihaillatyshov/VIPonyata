import React from "react";
import { StudentAssessmentTypeProps } from "../StudentAssessmentTypeProps";
import { TAssessmentCreateSentence } from "models/Activity/Items/TAssessmentItems";

const StudentAssessmentCreateSentence = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentCreateSentence>) => {
    return (
        <div>
            {data.parts.map((part: string, i: number) => (
                <div className="d-inline-flex mx-2" key={i} style={{}}>
                    {part}
                </div>
            ))}
        </div>
    );
};

export default StudentAssessmentCreateSentence;
