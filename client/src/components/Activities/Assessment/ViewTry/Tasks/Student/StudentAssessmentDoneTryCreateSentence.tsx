import { TAssessmentCheckedCreateSentence, TAssessmentCreateSentence } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

export const StudentAssessmentDoneTryCreateSentence = ({
    data,
    checks,
}: AssessmentDoneTryTaskBaseProps<TAssessmentCreateSentence, TAssessmentCheckedCreateSentence>) => {
    const getClassName = (id: number) => {
        return `dnd__sortable-item d-flex justify-content-center ${checks.mistake_parts.includes(id) ? "wrong" : ""}`;
    };

    return (
        <div className="d-flex flex-wrap gap-3 mt-2">
            {data.parts.map((item, id) => (
                <div key={id} className={getClassName(id)}>
                    {item}
                </div>
            ))}
        </div>
    );
};
