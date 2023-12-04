import React from "react";

import { TAssessmentCheckedOpenQuestion, TAssessmentDoneTryOpenQuestion } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

const Diff = require("diff");

export const StudentAssessmentDoneTryOpenQuestion = ({
    data,
    checks,
}: AssessmentDoneTryTaskBaseProps<TAssessmentDoneTryOpenQuestion, TAssessmentCheckedOpenQuestion>) => {
    console.log("StudentAssessmentDoneTryOpenQuestion", data, checks);

    const diffChars: any[] = Diff.diffChars(data.meta_answer, data.answer);

    console.log(diffChars);

    const getDiffItemColor = (diffItem: any) => {
        if (diffItem.added === true) return "#4e0707";
        if (diffItem.removed === true) return "#9b1003";
        return "green";
    };

    return (
        <div className="mt-2">
            <div className="prevent-select">{data.question}</div>
            {/* <div>
                <span className={className}>{data.answer} &nbsp;</span>
            </div> */}
            <div className="mt-2">
                <div className="">Твой ответ:</div>
                <span className="form-control mt-2">{data.answer} &nbsp;</span>
            </div>
            {data.meta_answer ? (
                <>
                    <div className="mt-2">
                        <div className="">Правильный ответ:</div>
                        <span className="form-control mt-1 input-good">{data.meta_answer} &nbsp;</span>
                    </div>

                    <div className="mt-2">
                        <div className="">Отличия:</div>
                        <div className="form-control">
                            {diffChars.map((diffItem, i) => (
                                <span key={i} style={{ color: getDiffItemColor(diffItem) }}>
                                    {diffItem.value}
                                </span>
                            ))}
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
};
