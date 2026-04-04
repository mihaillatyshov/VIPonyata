import React from "react";
import { useNavigate } from "react-router-dom";

import ActivityBouble from "components/Activities/Bouble/ActivityBouble";
import LoadingBouble from "components/Activities/Bouble/LoadingBouble";
import { LexisName } from "models/Activity/IActivity";
import { TDrilling } from "models/Activity/TDrilling";
import { THieroglyph } from "models/Activity/THieroglyph";

import styles from "./StylesTeacherBouble.module.css";
import TeacherActivityBoubleChild from "./TeacherActivityBoubleChild";

interface TeacherLexisBoubleProps {
    title: string;
    name: LexisName;
    lessonId: number;
    info: TDrilling | THieroglyph | undefined | null;
}

interface TeacherLexisBoubleChildProps {
    name: LexisName;
    lessonId: number;
    info: TDrilling | THieroglyph | null;
}

const array_chunks = <T extends any>(arr: T[], size: number): T[][] =>
    Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));

const TeacherLexisBoubleChild = ({ name, lessonId, info }: TeacherLexisBoubleChildProps) => {
    const getTasksArray = () => (info ? ["card", ...info.tasks.split(",").map((item) => item.trim())] : []);

    const getTaskIconClass = (taskName: string) => {
        switch (taskName) {
            case "card":
                return "bi-file-text";
            case "findpair":
                return "bi-link-45deg";
            case "scramble":
                return "bi-arrow-repeat";
            case "space":
                return "bi-pencil";
            case "translate":
                return "bi-card-text";
            default:
                return "bi-circle";
        }
    };

    return (
        <TeacherActivityBoubleChild name={name} info={info} lessonId={lessonId}>
            <div className="d-flex flex-wrap gap-2 justify-content-center align-items-center mt-2">
                {array_chunks(getTasksArray(), 4).map((row, rowId) => (
                    <div className="d-flex gap-2" key={rowId}>
                        {row.map((taskName) => (
                            <div className="d-flex" key={taskName}>
                                <i
                                    className={`bi ${getTaskIconClass(taskName)} ${styles.teacherBoubleTaskIcon}`}
                                    aria-label={taskName}
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </TeacherActivityBoubleChild>
    );
};

const TeacherLexisBouble = ({ title, name, lessonId, info }: TeacherLexisBoubleProps) => {
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
                    <TeacherLexisBoubleChild name={name} lessonId={lessonId} info={info} />
                </div>
            </ActivityBouble>
        </div>
    );
};

export default TeacherLexisBouble;
