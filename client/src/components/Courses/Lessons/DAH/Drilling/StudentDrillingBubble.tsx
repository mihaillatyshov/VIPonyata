import React from "react";
import { Button } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ServerAPI_POST } from "libs/ServerAPI";
import { setDrillingEndByTime } from "redux/slices/drillingSlice";
import StudentDrillingTimeRemaining from "./StudentDrillingTimeRemaining";
import { LogInfo } from "libs/Logger";

type StudentDrillingBubbleProps = {
    drilling: any;
};

const StudentDrillingBubble = ({ drilling }: StudentDrillingBubbleProps) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    LogInfo("SDBP drilling", drilling, drilling.info);

    const isInProgress = () => {
        if (drilling.info.tries && drilling.info.tries.length !== 0) {
            return drilling.info.tries[drilling.info.tries.length - 1].EndTime === null;
        }
        return false;
    };

    const onButtonClick = () => {
        ServerAPI_POST({
            url: `/api/drilling/${drilling.info.Id}` + (isInProgress() ? "/continuetry" : "/newtry"),
            onDataReceived: (data) => {
                navigate(`/drilling/${drilling.info.Id}`);
            },
            handleStatus: (res) => {
                if (res.status === 403) navigate("/");
            },
        });
    };

    const getButtonText = () => {
        return isInProgress() ? "Продолжить" : "Начать";
    };

    return (
        <div className="wrapperDAH">
            <div className="textDAH">
                <div>
                    <div> Лексика </div>
                    {isInProgress() ? (
                        drilling.info.Deadline && (
                            <div>
                                <StudentDrillingTimeRemaining
                                    deadline={drilling.info.Deadline}
                                    onDeadline={() => {
                                        dispatch(setDrillingEndByTime());
                                    }}
                                />
                            </div>
                        )
                    ) : drilling.info.TimeLimit ? (
                        <div> Время на выполнение теста: {drilling.info.TimeLimit} </div>
                    ) : (
                        <div> Нет ограничений по времени выполнения </div>
                    )}
                    <Button type="button" onClick={onButtonClick}>
                        {" "}
                        {getButtonText()}{" "}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default StudentDrillingBubble;
