import React from "react";

import ActivityBouble from "components/Activities/Bouble/ActivityBouble";
import LoadingBouble from "components/Activities/Bouble/LoadingBouble";
import { LexisName } from "models/Activity/IActivity";
import { LexisImages } from "models/Activity/ILexis";
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
            <div className="d-flex flex-wrap gap-2 justify-content-center align-items-center mt-2">
                {array_chunks(getTasksArray(), 4).map((row, rowId) => (
                    <div className="d-flex gap-2" key={rowId}>
                        {row.map((taskName) => (
                            <div className="d-flex" key={taskName}>
                                <img
                                    className={`${styles.teacherBoubleTaskIcon}`}
                                    src={getImgSrc(taskName)}
                                    alt={taskName}
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
    if (info === undefined) {
        return <LoadingBouble title={title} />;
    }

    return (
        <ActivityBouble title={title}>
            <div className="d-flex flex-column justify-content-center align-items-center mt-1">
                <TeacherLexisBoubleChild name={name} lessonId={lessonId} info={info} />
            </div>
        </ActivityBouble>
    );
};

export default TeacherLexisBouble;
