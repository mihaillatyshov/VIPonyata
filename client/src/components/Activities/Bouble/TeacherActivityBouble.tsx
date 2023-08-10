import React from "react";
import { ActivityName } from "../ActivityUtils";
import { TDrilling } from "models/Activity/TDrilling";
import { THieroglyph } from "models/Activity/THieroglyph";
import { TAssessment } from "models/Activity/TAssessment";
import ActivityBouble from "./ActivityBouble";
import LoadingBouble from "./LoadingBouble";
import { LexisImages } from "models/Activity/ILexis";

import styles from "./StylesBouble.module.css";
import { Link } from "react-router-dom";

const footerItemSize = "32px";

interface TeacherActivityBoubleProps {
    title: string;
    name: ActivityName;
    lessonId: number;
    info: TDrilling | THieroglyph | TAssessment | undefined | null;
}

interface TeacherActivityBoubleChildProps {
    name: ActivityName;
    lessonId: number;
    info: TDrilling | THieroglyph | TAssessment | null;
}

const TeacherActivityBoubleChild = ({ name, lessonId, info }: TeacherActivityBoubleChildProps) => {
    const onAddClick = () => {};

    if (info === null) {
        return (
            <Link to={`/${name}/create/${lessonId}`} className={"a-link"} onClick={onAddClick}>
                <i className={`bi bi-plus-lg ${styles.teacherBoublePlus}`} style={{ fontSize: "140px" }} />
            </Link>
        );
    }

    const tasks = ["card", ...info.tasks.split(",").map((item) => item.trim())];

    const getImgSrc = (taskName: string) => {
        for (let [name, src] of Object.entries(LexisImages)) {
            if (taskName === name) {
                return src;
            }
        }
        return undefined;
    };

    return (
        <div className="mt-2">
            <div>Лимит: {info.time_limit ?? "Нет"}</div>
            <div className="mt-2">
                {tasks.map((name) => (
                    <div className="d-inline" key={name}>
                        <img className={`m-2 ${styles.teacherBoubleTaskIcon}`} src={getImgSrc(name)} alt={name} />
                    </div>
                ))}
            </div>
            <div className={`d-flex justify-content-center w-100 ${styles.teacherBoubleFooter}`}>
                <i className="mx-3 bi bi-pencil-square" style={{ fontSize: footerItemSize }} />
                <i className="mx-3 bi bi-graph-up" style={{ fontSize: footerItemSize }} />
            </div>
        </div>
    );
};

const TeacherActivityBouble = ({ title, name, lessonId, info }: TeacherActivityBoubleProps) => {
    if (info === undefined) {
        return <LoadingBouble title={title} />;
    }

    return (
        <ActivityBouble title={title}>
            <TeacherActivityBoubleChild name={name} lessonId={lessonId} info={info} />
        </ActivityBouble>
    );
};

export default TeacherActivityBouble;
