import React from "react";
import ReactMarkdown from "react-markdown";

import { TAssessmentCheckedOpenQuestion, TAssessmentDoneTryOpenQuestion } from "models/Activity/Items/TAssessmentItems";

import { TeacherAssessmentDoneTryTaskProps } from "../AssessmentDoneTryTaskBase";

const Diff = require("diff");

export const TeacherAssessmentDoneTryOpenQuestion = ({
    data,
    checks,
    taskId,
    changeTask,
}: TeacherAssessmentDoneTryTaskProps<TAssessmentDoneTryOpenQuestion, TAssessmentCheckedOpenQuestion>) => {
    const className = `form-control mt-2 ${checks.cheked && checks.mistakes_count > 0 ? "" : "input-good"}`;

    const handleClick = (mistakes_count: number) => {
        changeTask(taskId, { ...checks, mistakes_count: mistakes_count, cheked: true });
    };

    const diffChars: any[] = Diff.diffChars(data.meta_answer || "", data.answer);

    console.log(diffChars);

    const getDiffItemColor = (diffItem: any) => {
        if (diffItem.added === true) return "#4e0707";
        if (diffItem.removed === true) return "#9b1003";
        return "green";
    };

    return (
        <div className="mt-2">
            <div className="prevent-select md-last-pad-zero">
                <ReactMarkdown>{data.question}</ReactMarkdown>
            </div>

            <div>
                <span className={className}>{data.answer} &nbsp;</span>
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
            <div className="d-flex mt-2 gap-3">
                <input type="button" value="Верно" className="btn btn-success" onClick={() => handleClick(0)} />
                <input type="button" value="Неверно" className="btn btn-danger" onClick={() => handleClick(1)} />
            </div>
        </div>
    );
};
