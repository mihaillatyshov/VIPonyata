import React from "react";

import StudentTimeRemaining from "components/Activities/StudentTimeRemaining";
import { AjaxPost } from "libs/ServerAPI";
import { TAssessment } from "models/Activity/TAssessment";
import { TDrilling } from "models/Activity/TDrilling";
import { THieroglyph } from "models/Activity/THieroglyph";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import { ActivityName } from "../ActivityUtils";
import ActivityBouble from "./ActivityBouble";

type StudentActivityBubbleProps = {
    title: string;
    name: ActivityName;
    info: TDrilling | THieroglyph | TAssessment;
    onDeadline: () => void;
};

const StudentActivityBubble = ({ info, title, name, onDeadline }: StudentActivityBubbleProps) => {
    const navigate = useNavigate();

    const isInProgress = () => {
        if (info.tries.length !== 0) {
            return info.tries[info.tries.length - 1].end_datetime === null;
        }
        return false;
    };

    const onButtonClick = () => {
        AjaxPost({ url: `/api/${name}/${info.id}` + (isInProgress() ? "/continuetry" : "/newtry") })
            .then(() => {
                navigate(`/${name}/${info.id}`);
            })
            .catch(({ isServerError, json, response }) => {
                if (!isServerError) {
                    if (response.status === 403) navigate("/");
                }
            });
    };

    const getButtonText = () => {
        return isInProgress() ? "Продолжить" : "Начать";
    };

    const getTextInfo = () => {
        if (isInProgress()) {
            if (info.deadline) {
                return <StudentTimeRemaining deadline={info.deadline} onDeadline={onDeadline} />;
            }
            return "Продолжить выполнение можно в любой момент";
        }
        if (info.time_limit) {
            return `Время на выполнение теста: ${info.time_limit}`;
        }
        return "Нет ограничений по времени выполнения";
    };

    return (
        <ActivityBouble title={title}>
            <div>{getTextInfo()}</div>
            <Button type="button" onClick={onButtonClick}>
                {getButtonText()}
            </Button>
        </ActivityBouble>
    );
};

export default StudentActivityBubble;
