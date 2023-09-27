import React from "react";
import StudentTimeRemaining from "./StudentTimeRemaining";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { TAssessment } from "models/Activity/TAssessment";
import { ILexis } from "models/Activity/ILexis";

type StudentActivityPageHeaderProps = {
    activityInfo: ILexis | TAssessment;
    backToLessonCallback: () => void;
};

const StudentActivityPageHeader = ({ activityInfo, backToLessonCallback }: StudentActivityPageHeaderProps) => {
    const navigate = useNavigate();

    const drawDeadlineComponent = () => {
        if (activityInfo.deadline) {
            return (
                <StudentTimeRemaining
                    deadline={activityInfo.deadline}
                    onDeadline={() => setTimeout(() => navigate(`/lessons/${activityInfo.lesson_id}`), 1000)}
                />
            );
        }
    };

    return (
        <>
            <Button onClick={backToLessonCallback}> Вернуться к уроку </Button>
            <div>{activityInfo.description}</div>
            {drawDeadlineComponent()}
        </>
    );
};

export default StudentActivityPageHeader;
