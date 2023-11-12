import React from "react";

import {
    TAssessmentCheckedFillSpacesByHand,
    TAssessmentFillSpacesByHand,
} from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

export const StudentAssessmentDoneTryFillSpacesByHand = ({
    data,
    checks,
    taskId,
}: AssessmentDoneTryTaskBaseProps<TAssessmentFillSpacesByHand, TAssessmentCheckedFillSpacesByHand>) => {
    const calcWidth = (word: string) => {
        return Math.min(Math.max(word.length * 0.9, 5), 20) + "rem";
    };

    return (
        <div className="d-flex flex-wrap">
            {data.separates.map((element: string, i: number) => (
                <div key={i} className="d-flex flex-wrap">
                    <div className="me-2 mt-1">{element}</div>
                    {i < data.separates.length - 1 && (
                        <input
                            className="me-2 mt-1"
                            style={{ height: "1.5rem", width: calcWidth(data.answers[i]) }}
                            type="text"
                            value={data.answers[i]}
                            onChange={() => {}}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};
