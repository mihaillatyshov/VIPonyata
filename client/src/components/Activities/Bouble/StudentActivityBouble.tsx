import React from "react";
import { useNavigate } from "react-router-dom";

import { AjaxPost } from "libs/ServerAPI";
import { ActivityName } from "models/Activity/IActivity";
import { TAssessment } from "models/Activity/TAssessment";
import { TDrilling } from "models/Activity/TDrilling";
import { THieroglyph } from "models/Activity/THieroglyph";

import StudentViewDoneTryButton from "../ViewTry/StudentViewDoneTryButton";
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
        if (isInProgress()) {
            return "Продолжить";
        }
        if (info.tries.length !== 0) {
            return "Начать заново";
        }
        return "Начать";
    };

    return (
        <ActivityBouble title={title}>
            <div className="d-flex flex-column justify-content-center align-items-center">
                <div className="mt-2">
                    <input type="button" className="btn btn-success" onClick={onButtonClick} value={getButtonText()} />
                </div>
                <div className="mt-2">
                    <StudentViewDoneTryButton name={name} id={info.id} />
                </div>
            </div>
        </ActivityBouble>
    );
};

export default StudentActivityBubble;
