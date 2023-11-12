import React from "react";

import { TAssessmentCheckedText, TAssessmentText } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

export const StudentAssessmentDoneTryText = ({
    data,
}: AssessmentDoneTryTaskBaseProps<TAssessmentText, TAssessmentCheckedText>) => {
    return <div>{data.text}</div>;
};
