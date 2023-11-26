import React from "react";

import {
    TAssessmentCheckedFillSpacesByHand,
    TAssessmentDoneTryFillSpacesByHand,
} from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";
import { IStudentAssessmentDoneTryFillSpaces } from "./IStudentAssessmentDoneTryFillSpaces";

export const StudentAssessmentDoneTryFillSpacesByHand = ({
    data,
    checks,
    taskId,
}: AssessmentDoneTryTaskBaseProps<TAssessmentDoneTryFillSpacesByHand, TAssessmentCheckedFillSpacesByHand>) => {
    return <IStudentAssessmentDoneTryFillSpaces data={data} checks={checks} taskId={taskId} />;
};
