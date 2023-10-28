import React from "react";

import { ILexis } from "models/Activity/ILexis";
import { TAssessment } from "models/Activity/TAssessment";
import { useNavigate } from "react-router-dom";

import StudentTimeRemaining from "./StudentTimeRemaining";

type StudentActivityDeadlineProps = {
    activityInfo: ILexis | TAssessment;
};

const StudentActivityDeadline = ({ activityInfo }: StudentActivityDeadlineProps) => {
    const navigate = useNavigate();

    if (activityInfo.deadline) {
        return (
            <StudentTimeRemaining
                deadline={activityInfo.deadline}
                onDeadline={() => setTimeout(() => navigate(`/lessons/${activityInfo.lesson_id}`), 1000)}
            />
        );
    }
    return <></>;
};

export default StudentActivityDeadline;
