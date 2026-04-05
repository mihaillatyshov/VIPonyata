import React from "react";
import { useNavigate } from "react-router-dom";

import ActivityBubble from "components/Activities/Bubble/ActivityBubble";
import LoadingBubble from "components/Activities/Bubble/LoadingBubble";
import { LexisName } from "models/Activity/IActivity";
import { TDrilling } from "models/Activity/TDrilling";
import { THieroglyph } from "models/Activity/THieroglyph";

import styles from "./StylesTeacherBubble.module.css";
import TeacherActivityBubbleChild from "./TeacherActivityBubbleChild";

interface TeacherLexisBubbleProps {
    title: string;
    name: LexisName;
    lessonId: number;
    info: TDrilling | THieroglyph | undefined | null;
}

interface TeacherLexisBubbleChildProps {
    name: LexisName;
    lessonId: number;
    info: TDrilling | THieroglyph | null;
}

const array_chunks = <T,>(arr: T[], size: number): T[][] =>
    Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));

const TeacherLexisBubbleChild = ({ name, lessonId, info }: TeacherLexisBubbleChildProps) => {
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
        <TeacherActivityBubbleChild name={name} info={info} lessonId={lessonId}>
            <div className="d-flex flex-wrap gap-2 justify-content-center align-items-center mt-2">
                {array_chunks(getTasksArray(), 4).map((row, rowId) => (
                    <div className="d-flex gap-2" key={rowId}>
                        {row.map((taskName) => (
                            <div className="d-flex" key={taskName}>
                                <i
                                    className={`bi ${getTaskIconClass(taskName)} ${styles.teacherBubbleTaskIcon}`}
                                    aria-label={taskName}
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </TeacherActivityBubbleChild>
    );
};

const TeacherLexisBubble = ({ title, name, lessonId, info }: TeacherLexisBubbleProps) => {
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
                    <TeacherLexisBubbleChild name={name} lessonId={lessonId} info={info} />
                </div>
            </ActivityBubble>
        </div>
    );
};

export default TeacherLexisBubble;
