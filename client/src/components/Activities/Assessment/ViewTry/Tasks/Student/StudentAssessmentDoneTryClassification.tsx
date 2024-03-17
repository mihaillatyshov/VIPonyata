import React, { useMemo } from "react";

import { FindMaxStr } from "libs/Autisize";
import AutosizeDiv from "libs/AutosizeDiv";
import { TAssessmentCheckedClassification, TAssessmentClassification } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

interface ContainerProps {
    items: string[];
    longestStr: string;
    title: string;
    wrongItems: number[];
}

const Container = ({ items, longestStr, title, wrongItems }: ContainerProps) => {
    const getItemClassName = (i: number) => {
        return `student-assessment-classification__item ${wrongItems.includes(i) ? "wrong" : "good"}`;
    };

    return (
        <div className="student-assessment-classification__card answers">
            <div className="student-assessment-classification__column-title">{title}</div>
            {title ? (
                <div className="student-assessment-classification__hr">
                    <AutosizeDiv
                        value={""}
                        valueToCalcSize={longestStr}
                        inputClassName="student-assessment-classification__item-autosize"
                        className="student-assessment-classification__item-autosize"
                    />
                    <hr className="m-0 p-0" />
                </div>
            ) : null}
            {items.map((str, i) => (
                <AutosizeDiv
                    key={i}
                    value={str}
                    valueToCalcSize={longestStr}
                    inputClassName={getItemClassName(i)}
                    className="student-assessment-classification__item-autosize"
                />
            ))}
        </div>
    );
};
export const StudentAssessmentDoneTryClassification = ({
    data,
    checks,
}: AssessmentDoneTryTaskBaseProps<TAssessmentClassification, TAssessmentCheckedClassification>) => {
    const longestStr = useMemo(
        () => FindMaxStr([data.inputs, ...data.answers].map(FindMaxStr)),
        [data.inputs, data.answers],
    );

    return (
        <div className="student-assessment-classification__answers-wrapper">
            {data.answers.map((col, i) => (
                <Container
                    key={i + 1}
                    items={col}
                    longestStr={longestStr}
                    title={data.titles[i]}
                    wrongItems={checks.mistake_answers[i]}
                />
            ))}
        </div>
    );
};
