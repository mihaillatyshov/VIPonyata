import { useMemo } from "react";

import { ReactMarkdownWithHtml } from "components/Common/ReactMarkdownWithHtml";
import { FindMaxStr, fixRubyStr } from "libs/Autisize";
import AutosizeDiv from "libs/AutosizeDiv";
import {
    TAssessmentCheckedClassification,
    TAssessmentDoneTryClassification,
} from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

interface ContainerProps {
    items: string[];
    longestStr: string;
    title: string;
    wrongItems?: number[];
    isCorrectAnswers?: boolean;
    studentItems?: string[];
}

const Container = ({
    items,
    longestStr,
    title,
    wrongItems = [],
    isCorrectAnswers = false,
    studentItems = [],
}: ContainerProps) => {
    const getItemClassName = (i: number) => {
        if (isCorrectAnswers) {
            const isMissed = !studentItems.includes(items[i]);
            const isAlreadyGiven = studentItems.includes(items[i]);

            if (isAlreadyGiven) {
                return "student-assessment-classification__item student-assessment-correct-answer-muted";
            }

            return wrongItems.includes(i) || isMissed
                ? "student-assessment-classification__item student-assessment-correct-answer"
                : "student-assessment-classification__item";
        }

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
                <div
                    key={i}
                    className={`student-assessment-classification__item-autosize form-control prevent-select md-last-pad-zero ${getItemClassName(
                        i,
                    )}`}
                >
                    <ReactMarkdownWithHtml>{str}</ReactMarkdownWithHtml>
                </div>
                // <AutosizeDiv
                //     key={i}
                //     value={str}
                //     valueToCalcSize={longestStr}
                //     inputClassName={getItemClassName(i)}
                //     className=""
                // />
            ))}
        </div>
    );
};
export const StudentAssessmentDoneTryClassification = ({
    data,
    checks,
}: AssessmentDoneTryTaskBaseProps<TAssessmentDoneTryClassification, TAssessmentCheckedClassification>) => {
    const longestStr = useMemo(
        () =>
            FindMaxStr(
                [data.inputs, ...data.answers].map((item) => FindMaxStr(item, fixRubyStr)),
                fixRubyStr,
            ),
        [data.inputs, data.answers],
    );

    return (
        <div className="student-assessment-view-sortable-order__container">
            <div className="student-assessment-view-sortable-order__wrapper">
                <div>Твои ответы: </div>
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
            </div>

            {checks.mistakes_count > 0 && (
                <div className="student-assessment-view-sortable-order__wrapper">
                    <div>Правильные ответы: </div>
                    <div className="student-assessment-classification__answers-wrapper">
                        {data.meta_answers.map((col, i) => (
                            <Container
                                key={`meta_${i + 1}`}
                                items={col}
                                longestStr={longestStr}
                                title={data.titles[i]}
                                wrongItems={checks.mistake_answers[i]}
                                isCorrectAnswers={true}
                                studentItems={data.answers[i]}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
