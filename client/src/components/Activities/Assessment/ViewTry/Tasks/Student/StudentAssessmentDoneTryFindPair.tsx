import React from "react";

import { ReactMarkdownWithHtml } from "components/Common/ReactMarkdownWithHtml";
import { TAssessmentCheckedFindPair, TAssessmentDoneTryFindPair } from "models/Activity/Items/TAssessmentItems";

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
        return `student-assessment-find-pair__item prevent-select md-last-pad-zero
        ${alignRight ? "right" : ""}
        ${id < parsCreated ? answerClass : ""} `;
    };

    return (
        <div className={getClassName()}>
            <ReactMarkdownWithHtml>{field}</ReactMarkdownWithHtml>
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
        <div className="row student-assessment-find-pair__row">
            <FieldRowItem field={first} id={id} parsCreated={parsCreated} alignRight={true} isWrong={isWrong} />
            <FieldRowItem field={second} id={id} parsCreated={parsCreated} isWrong={isWrong} />
        </div>
    );
};

export const StudentAssessmentDoneTryFindPair = ({
    data,
    checks,
}: AssessmentDoneTryTaskBaseProps<TAssessmentDoneTryFindPair, TAssessmentCheckedFindPair>) => {
    const rowClassName = `row row-cols-1 mt-0 mx-auto ${checks.mistakes_count > 0 ? "row-cols-md-2 g-4" : ""}`;

    return (
        <div className={rowClassName}>
            <div className="col student-assessment-find-pair__col">
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

            {checks.mistakes_count > 0 && (
                <div className="col student-assessment-find-pair__col">
                    {data.meta_first.map((first, i) => (
                        <FieldRow
                            key={i}
                            id={i}
                            parsCreated={data.meta_first.length}
                            first={first}
                            second={data.meta_second[i]}
                            isWrong={false}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
