import React from "react";

import { IAssessmentName } from "models/Activity/IActivity";
import { TProcessingType } from "models/Processing";

interface IAssessmentProcessingPageProps {
    title: string;
    name: IAssessmentName;
    processingType: TProcessingType;
}

export const IAssessmentProcessingPage = ({ title, name, processingType }: IAssessmentProcessingPageProps) => {
    return <div>IAssessmentProcessingPage</div>;
};
