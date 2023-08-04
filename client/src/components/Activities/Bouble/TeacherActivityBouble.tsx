import React from "react";
import { ActivityName } from "../ActivityUtils";
import { TDrilling } from "models/Activity/TDrilling";
import { THieroglyph } from "models/Activity/THieroglyph";
import { TAssessment } from "models/Activity/TAssessment";
import ActivityBouble from "./ActivityBouble";
import LoadingBouble from "./LoadingBouble";
import { LexisImages } from "models/Activity/ILexis";

interface TeacherActivityBoubleProps {
    title: string;
    name: ActivityName;
    info: TDrilling | THieroglyph | TAssessment | undefined | null;
}

interface TeacherActivityBoubleChildProps {
    info: TDrilling | THieroglyph | TAssessment | null;
}

const TeacherActivityBoubleChild = ({ info }: TeacherActivityBoubleChildProps) => {
    const onAddClick = () => {};

    console.log("drilling: ", info);

    if (info === null) {
        return (
            <div onClick={onAddClick}>
                <i className="bi bi-plus-lg" style={{ fontSize: "140px" }} />
            </div>
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
                        <img className="m-2" src={getImgSrc(name)} alt={name} style={{ width: "32px" }} />
                    </div>
                ))}
            </div>
            <div className="d-flex justify-content-center w-100" style={{ position: "absolute", bottom: "16px" }}>
                <i className="mx-3 bi bi-pencil-square" style={{ fontSize: "32px" }} />
                <i className="mx-3 bi bi-graph-up" style={{ fontSize: "32px" }} />
            </div>
        </div>
    );
};

const TeacherActivityBouble = ({ title, name, info }: TeacherActivityBoubleProps) => {
    if (info === undefined) {
        return <LoadingBouble title={title} />;
    }

    return (
        <ActivityBouble title={title}>
            <TeacherActivityBoubleChild info={info} />
        </ActivityBouble>
    );
};

export default TeacherActivityBouble;
