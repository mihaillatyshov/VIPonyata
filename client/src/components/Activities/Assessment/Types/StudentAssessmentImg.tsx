import React from "react";
import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";
import { TAssessmentImg } from "models/Activity/Items/TAssessmentItems";

const StudentAssessmentImg = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentImg>) => {
    return (
        <div>
            <img alt="Img" src={data.url} />
        </div>
    );
};

export default StudentAssessmentImg;
