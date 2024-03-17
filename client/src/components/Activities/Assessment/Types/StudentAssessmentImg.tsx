import React from "react";

import { TAssessmentImg } from "models/Activity/Items/TAssessmentItems";

import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentImg = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentImg>) => {
    return (
        <div className="d-flex w-100 justify-content-center mt-2">
            <img alt="Img" className="img-base" src={data.url} />
        </div>
    );
};

export default StudentAssessmentImg;
