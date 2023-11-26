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
        return `student-assessment-classification__item text-center ${wrongItems.includes(i) ? "wrong" : "good"}`;
    };

    return (
        <div className="p-2 d-flex flex-column student-assessment-classification__answers">
            <div className="student-assessment-classification__column-title">{title}</div>
            {title ? (
                <>
                    <AutosizeDiv
                        value={""}
                        valueToCalcSize={longestStr}
                        inputClassName="student-assessment-classification__item-autosize"
                        className="student-assessment-classification__item-autosize"
                    />
                    <hr className="m-0 mb-2" />
                </>
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
        <div className="d-flex flex-wrap justify-content-center gap-3">
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
