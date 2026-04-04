import React from "react";
import { useNavigate } from "react-router-dom";

import { IAssessmentName } from "models/Activity/IActivity";
import { TAssessment } from "models/Activity/TAssessment";

import ActivityBouble from "../ActivityBouble";
import LoadingBouble from "../LoadingBouble";
import styles from "./StylesTeacherBouble.module.css";
import TeacherActivityBoubleChild from "./TeacherActivityBoubleChild";

export interface ITeacherAsssessmentBoubleProps {
    title: string;
    name: IAssessmentName;
    lessonId: number;
    info: TAssessment | undefined | null;
}

const ITeacherAsssessmentBouble = ({ title, name, lessonId, info }: ITeacherAsssessmentBoubleProps) => {
    const navigate = useNavigate();

    if (info === undefined) {
        return <LoadingBouble title={title} />;
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
            className={`${styles.teacherBoubleClickable} ${info !== null ? styles.teacherBoubleWithContent : ""}`}
            onClick={onBubbleClick}
            onKeyDown={onBubbleKeyDown}
            role="button"
            tabIndex={0}
        >
            <ActivityBouble title={title}>
                <div
                    className={`d-flex flex-column justify-content-center align-items-center ${styles.teacherBoubleContent}`}
                >
                    <TeacherActivityBoubleChild name={name} lessonId={lessonId} info={info} />
                </div>
            </ActivityBouble>
        </div>
    );
};

export default ITeacherAsssessmentBouble;
