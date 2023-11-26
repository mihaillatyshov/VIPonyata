import React from "react";

import { TAssessmentCheckedOpenQuestion, TAssessmentDoneTryOpenQuestion } from "models/Activity/Items/TAssessmentItems";

import { TeacherAssessmentDoneTryTaskProps } from "../AssessmentDoneTryTaskBase";

export const TeacherAssessmentDoneTryOpenQuestion = ({
    data,
    checks,
    taskId,
    changeTask,
}: TeacherAssessmentDoneTryTaskProps<TAssessmentDoneTryOpenQuestion, TAssessmentCheckedOpenQuestion>) => {
    const className = `form-control mt-2 ${checks.cheked && checks.mistakes_count > 0 ? "input-wrong" : ""}`;

    const handleClick = (mistakes_count: number) => {
        changeTask(taskId, { ...checks, mistakes_count: mistakes_count, cheked: true });
    };

    return (
        <div className="mt-2">
            <div className="prevent-select">{data.question}</div>
            <div>
                <span className={className}>{data.answer} &nbsp;</span>
            </div>
            {data.meta_answer ? (
                <div>
                    <span className="form-control mt-2 input-good">{data.meta_answer} &nbsp;</span>
                </div>
            ) : null}
            <div className="d-flex mt-2 gap-3">
                <input type="button" value="Верно" className="btn btn-success" onClick={() => handleClick(0)} />
                <input type="button" value="Неверно" className="btn btn-danger" onClick={() => handleClick(1)} />
            </div>
        </div>
    );
};
