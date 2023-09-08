import React from "react";
import { TDrilling } from "models/Activity/TDrilling";
import { THieroglyph } from "models/Activity/THieroglyph";
import ActivityBouble from "components/Activities/Bouble/ActivityBouble";
import LoadingBouble from "components/Activities/Bouble/LoadingBouble";
import { LexisImages } from "models/Activity/ILexis";
import { LexisName } from "components/Activities/Lexis/Types/LexisUtils";

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

const TeacherLexisBoubleChild = ({ name, lessonId, info }: TeacherLexisBoubleChildProps) => {
    const getTasksArray = () => (info ? ["card", ...info.tasks.split(",").map((item) => item.trim())] : []);

    const getImgSrc = (taskName: string) => {
        for (let [name, src] of Object.entries(LexisImages)) {
            if (taskName === name) {
                return src;
            }
        }
        return undefined;
    };

    return (
        <TeacherActivityBoubleChild name={name} info={info} lessonId={lessonId}>
            <div className="mt-2">
                {getTasksArray().map((name) => (
                    <div className="d-inline" key={name}>
                        <img className={`m-2 ${styles.teacherBoubleTaskIcon}`} src={getImgSrc(name)} alt={name} />
                    </div>
                ))}
            </div>
        </TeacherActivityBoubleChild>
    );
};

const TeacherLexisBouble = ({ title, name, lessonId, info }: TeacherLexisBoubleProps) => {
    if (info === undefined) {
        return <LoadingBouble title={title} />;
    }

    return (
        <ActivityBouble title={title}>
            <TeacherLexisBoubleChild name={name} lessonId={lessonId} info={info} />
        </ActivityBouble>
    );
};

export default TeacherLexisBouble;
