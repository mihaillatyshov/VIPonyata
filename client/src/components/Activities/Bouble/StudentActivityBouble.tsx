import React from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ServerAPI_POST } from "libs/ServerAPI";
import StudentTimeRemaining from "components/Activities/StudentTimeRemaining";
import { LogInfo } from "libs/Logger";
import ActivityBouble from "./ActivityBouble";
import { ActivityName } from "../ActivityUtils";

type StudentActivityBubbleProps = {
    info: any;
    title: string;
    name: ActivityName;
    onDeadline: () => void;
};

const StudentActivityBubble = ({ info, title, name, onDeadline }: StudentActivityBubbleProps) => {
    const navigate = useNavigate();

    LogInfo("ActivityBubble info:", info);

    const isInProgress = () => {
        if (info.tries && info.tries.length !== 0) {
            LogInfo("end_datetime", info.tries[info.tries.length - 1].end_datetime);
            return info.tries[info.tries.length - 1].end_datetime === null;
        }
        return false;
    };

    const onButtonClick = () => {
        ServerAPI_POST({
            url: `/api/${name}/${info.id}` + (isInProgress() ? "/continuetry" : "/newtry"),
            onDataReceived: (data) => {
                navigate(`/${name}/${info.id}`);
            },
            handleStatus: (res) => {
                if (res.status === 403) navigate("/");
            },
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
