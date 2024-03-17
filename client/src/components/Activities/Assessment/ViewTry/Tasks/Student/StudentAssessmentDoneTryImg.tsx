import React from "react";

import { TAssessmentCheckedImg, TAssessmentImg } from "models/Activity/Items/TAssessmentItems";

import { AssessmentDoneTryTaskBaseProps } from "../AssessmentDoneTryTaskBase";

export const StudentAssessmentDoneTryImg = ({
    data,
}: AssessmentDoneTryTaskBaseProps<TAssessmentImg, TAssessmentCheckedImg>) => {
    return (
        <div className="d-flex w-100 justify-content-center mt-2">
            <img alt="Img" className="img-base" src={data.url} />
        </div>
    );
};
