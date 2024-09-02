import React from "react";
import ReactMarkdown from "react-markdown";

import { TAssessmentCheckedOpenQuestion, TAssessmentDoneTryOpenQuestion } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

const Diff = require("diff");

export const StudentAssessmentDoneTryOpenQuestion = ({
    data,
    checks,
}: AssessmentDoneTryTaskBaseProps<TAssessmentDoneTryOpenQuestion, TAssessmentCheckedOpenQuestion>) => {
    console.log("StudentAssessmentDoneTryOpenQuestion", data, checks);

    const diffChars: any[] = Diff.diffChars(data.meta_answer || "", data.answer);

    console.log(diffChars);

    const getDiffItemColor = (diffItem: any) => {
        if (diffItem.added === true) return "#4e0707";
        if (diffItem.removed === true) return "#9b1003";
        return "green";
    };

    return (
        <div className="student-assessment-view-open-question__container">
            <div className="prevent-select md-last-pad-zero">
                <ReactMarkdown>{data.question}</ReactMarkdown>
            </div>

            <div className="student-assessment-view-open-question__wrapper">
                <div>Твой ответ:</div>
                <span className="form-control">{data.answer} &nbsp;</span>
            </div>
            {data.meta_answer ? (
                <>
                    <div className="student-assessment-open-question__wrapper">
                        <div>Правильный ответ:</div>
                        <span className="form-control input-good">{data.meta_answer} &nbsp;</span>
                    </div>

                    <div className="student-assessment-open-question__wrapper">
                        <div>Отличия:</div>
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
