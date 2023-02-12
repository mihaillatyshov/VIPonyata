import React from "react";
import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentImg = ({ data, taskId }: StudentAssessmentTypeProps) => {
    return (
        <div>
            <img alt="Img" src={data.url} />
        </div>
    );
};

export default StudentAssessmentImg;
