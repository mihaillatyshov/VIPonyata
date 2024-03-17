import {
    TAssessmentCheckedCreateSentence,
    TAssessmentDoneTryCreateSentence,
} from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

export const StudentAssessmentDoneTryCreateSentence = ({
    data,
    checks,
}: AssessmentDoneTryTaskBaseProps<TAssessmentDoneTryCreateSentence, TAssessmentCheckedCreateSentence>) => {
    const getClassName = (id: number) => {
        return `student-assessment-view-sortable-order__item ${checks.mistake_parts.includes(id) ? "wrong" : "good"}`;
    };

    return (
        <div className="student-assessment-view-sortable-order__container">
            <div className="student-assessment-view-sortable-order__wrapper">
                <div>Твои ответы: </div>
                <div className="student-assessment-sortable-order horizontal">
                    {data.parts.map((item, id) => (
                        <div key={id} className={getClassName(id)}>
                            {item}
                        </div>
                    ))}
                </div>
            </div>
            {checks.mistakes_count > 0 && (
                <div className="student-assessment-view-sortable-order__wrapper">
                    <div>Правильные ответы: </div>

                    <div className="student-assessment-sortable-order horizontal">
                        {data.meta_parts.map((item, id) => (
                            <div key={id} className="student-assessment-view-sortable-order__item good">
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
