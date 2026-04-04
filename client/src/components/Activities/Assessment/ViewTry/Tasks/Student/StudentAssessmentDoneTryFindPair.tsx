import { ReactMarkdownWithHtml } from "components/Common/ReactMarkdownWithHtml";
import { TAssessmentCheckedFindPair, TAssessmentDoneTryFindPair } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

interface FieldRowItemProps {
    id: number;
    field: string;
    parsCreated: number;
    alignRight?: boolean;
    answerState: "wrong" | "good" | "missed" | "correct-answer" | "plain";
}

const FieldRowItem = ({ id, field, parsCreated, alignRight, answerState }: FieldRowItemProps) => {
    const answerClass = answerState === "plain" ? "" : answerState;
    const isAnsweredRow = id < parsCreated || answerState === "wrong";
    const getClassName = () => {
        return `student-assessment-find-pair__item prevent-select md-last-pad-zero
        ${alignRight ? "right" : ""}
        ${isAnsweredRow ? answerClass : ""} `;
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
    answerState: "wrong" | "good" | "missed" | "correct-answer" | "plain";
}

const FieldRow = ({ id, parsCreated, first, second, answerState }: FieldRowProps) => {
    return (
        <div className="row student-assessment-find-pair__row">
            <FieldRowItem field={first} id={id} parsCreated={parsCreated} alignRight={true} answerState={answerState} />
            <FieldRowItem field={second} id={id} parsCreated={parsCreated} answerState={answerState} />
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
                <div className="student-assessment-find-pair__label">Твои ответы:</div>
                {data.first.map((first, i) => (
                    <FieldRow
                        key={i}
                        id={i}
                        parsCreated={data.pars_created}
                        first={first}
                        second={data.second[i]}
                        answerState={checks.mistake_lines.includes(i) ? "wrong" : "good"}
                    />
                ))}
            </div>

            {checks.mistakes_count > 0 && (
                <div className="col student-assessment-find-pair__col">
                    <div className="student-assessment-find-pair__label">Правильные ответы:</div>
                    {data.meta_first.map((first, i) => (
                        <FieldRow
                            key={i}
                            id={i}
                            parsCreated={data.meta_first.length}
                            first={first}
                            second={data.meta_second[i]}
                            answerState={
                                checks.mistake_lines.includes(i) || i >= data.pars_created ? "correct-answer" : "plain"
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
