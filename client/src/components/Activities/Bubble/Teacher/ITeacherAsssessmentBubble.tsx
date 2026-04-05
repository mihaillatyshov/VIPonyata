import React from "react";
import { useNavigate } from "react-router-dom";

import { IAssessmentName } from "models/Activity/IActivity";
import { TAssessment } from "models/Activity/TAssessment";

import ActivityBubble from "../ActivityBubble";
import LoadingBubble from "../LoadingBubble";
import styles from "./StylesTeacherBubble.module.css";
import TeacherActivityBubbleChild from "./TeacherActivityBubbleChild";

export interface ITeacherAsssessmentBubbleProps {
    title: string;
    name: IAssessmentName;
    lessonId: number;
    info: TAssessment | undefined | null;
}

const ITeacherAsssessmentBubble = ({ title, name, lessonId, info }: ITeacherAsssessmentBubbleProps) => {
    const navigate = useNavigate();

    if (info === undefined) {
        return <LoadingBubble title={title} />;
    }

    const url = info === null ? `/${name}/create/${lessonId}` : `/${name}/edit/${info.id}`;

    const onBubbleClick = () => {
        navigate(url);
    };

    const onBubbleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(url);
        }
    };

    return (
        <div
            className={`${styles.teacherBubbleClickable} ${info !== null ? styles.teacherBubbleWithContent : ""}`}
            onClick={onBubbleClick}
            onKeyDown={onBubbleKeyDown}
            role="button"
            tabIndex={0}
        >
            <ActivityBubble title={title}>
                <div
                    className={`d-flex flex-column justify-content-center align-items-center ${styles.teacherBubbleContent}`}
                >
                    <TeacherActivityBubbleChild name={name} lessonId={lessonId} info={info} />
                </div>
            </ActivityBubble>
        </div>
    );
};

export default ITeacherAsssessmentBubble;
