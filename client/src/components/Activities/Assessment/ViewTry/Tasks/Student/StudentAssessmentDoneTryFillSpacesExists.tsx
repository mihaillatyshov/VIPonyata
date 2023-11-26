import React from "react";

import {
    TAssessmentCheckedFillSpacesExists,
    TAssessmentDoneTryFillSpacesExists,
} from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";
import { IStudentAssessmentDoneTryFillSpaces } from "./IStudentAssessmentDoneTryFillSpaces";

export const StudentAssessmentDoneTryFillSpacesExists = ({
    data,
    checks,
    taskId,
}: AssessmentDoneTryTaskBaseProps<TAssessmentDoneTryFillSpacesExists, TAssessmentCheckedFillSpacesExists>) => {
    return <IStudentAssessmentDoneTryFillSpaces data={data} checks={checks} taskId={taskId} />;
};
