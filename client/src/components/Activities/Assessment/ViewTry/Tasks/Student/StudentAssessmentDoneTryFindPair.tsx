import React from "react";

import { TAssessmentCheckedFindPair, TAssessmentFindPair } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

interface FieldRowItemProps {
    id: number;
    field: string;
    parsCreated: number;
    alignRight?: boolean;
    isWrong: boolean;
}

const FieldRowItem = ({ id, field, parsCreated, alignRight, isWrong }: FieldRowItemProps) => {
    const answerClass = isWrong ? "wrong" : "done";
    const getClassName = () => {
        return `student-assessment-find-pair__item
        ${alignRight ? "right" : ""}
        ${id < parsCreated ? answerClass : ""} `;
    };

    return (
        <div className="col-6 my-2">
            <div className={getClassName()}>{field}</div>
        </div>
    );
};

interface FieldRowProps {
    id: number;
    parsCreated: number;
    first: string;
    second: string;
    isWrong: boolean;
}

const FieldRow = ({ id, parsCreated, first, second, isWrong }: FieldRowProps) => {
    return (
        <div className="row position-relative">
            <FieldRowItem field={first} id={id} parsCreated={parsCreated} alignRight={true} isWrong={isWrong} />
            {id < parsCreated && <div className="student-assessment-find-pair__item-connector" />}
            <FieldRowItem field={second} id={id} parsCreated={parsCreated} isWrong={isWrong} />
        </div>
    );
};

export const StudentAssessmentDoneTryFindPair = ({
    data,
    checks,
    taskId,
}: AssessmentDoneTryTaskBaseProps<TAssessmentFindPair, TAssessmentCheckedFindPair>) => {
    return (
        <div>
            {data.first.map((first, i) => (
                <FieldRow
                    key={i}
                    id={i}
                    parsCreated={data.pars_created}
                    first={first}
                    second={data.second[i]}
                    isWrong={checks.mistake_lines.includes(i)}
                />
            ))}
        </div>
    );
};