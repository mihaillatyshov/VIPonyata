import React from "react";

import { AjaxPost } from "libs/ServerAPI";
import { ActivityName } from "models/Activity/IActivity";
import { TAssessment } from "models/Activity/TAssessment";
import { TDrilling } from "models/Activity/TDrilling";
import { THieroglyph } from "models/Activity/THieroglyph";
import { useNavigate } from "react-router-dom";

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
        return isInProgress() ? "Продолжить" : "Начать";
    };

    return (
        <ActivityBouble title={title}>
            <div className="mt-5">
                <input type="button" className="btn btn-success" onClick={onButtonClick} value={getButtonText()} />
            </div>
            <div className="mt-5">
                <StudentViewDoneTryButton name={name} id={info.id} />
            </div>
        </ActivityBouble>
    );
};

export default StudentActivityBubble;
