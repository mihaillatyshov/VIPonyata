import React from "react";
import StudentTimeRemaining from "./StudentTimeRemaining";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

type StudentActivityPageHeaderProps = {
    activityInfo: any;
    backToLessonCallback: () => void;
};

const StudentActivityPageHeader = ({ activityInfo, backToLessonCallback }: StudentActivityPageHeaderProps) => {
    const navigate = useNavigate();

    const drawDeadlineComponent = () => {
        if (activityInfo.deadline) {
            return (
                <StudentTimeRemaining
                    deadline={activityInfo.deadline}
                    onDeadline={() => navigate(`/lessons/${activityInfo.lesson_id}`)}
                />
            );
        }
    };

    return (
        <>
            <Button onClick={backToLessonCallback}> Вернуться к уроку </Button>
            <div>
                {activityInfo.description} {activityInfo.time_limit} {activityInfo.try.start_datetime}
            </div>
            {drawDeadlineComponent()}
        </>
    );
};

export default StudentActivityPageHeader;
