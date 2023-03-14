import React from "react";
import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";
import { TAssessmentSentenceOrder } from "models/Activity/Items/TAssessmentItems";

const StudentAssessmentSentenceOrder = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentSentenceOrder>) => {
    return (
        <div>
            {data.sentences.map((element: string, i: number) => (
                <div key={i}>{element}</div>
            ))}
        </div>
    );
};

export default StudentAssessmentSentenceOrder;
