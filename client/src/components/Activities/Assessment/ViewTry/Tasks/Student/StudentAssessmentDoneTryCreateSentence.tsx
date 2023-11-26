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
        return `dnd__sortable-item d-flex justify-content-center ${
            checks.mistake_parts.includes(id) ? "wrong" : "good"
        }`;
    };

    return (
        <div className="mt-2 d-flex flex-column gap-4">
            <div className="d-flex flex-wrap gap-3">
                {data.parts.map((item, id) => (
                    <div key={id} className={getClassName(id)}>
                        {item}
                    </div>
                ))}
            </div>
            {checks.mistakes_count > 0 && (
                <div className="d-flex flex-wrap gap-3">
                    {data.meta_parts.map((item, id) => (
                        <div key={id} className="dnd__sortable-item d-flex justify-content-center good">
                            {item}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
