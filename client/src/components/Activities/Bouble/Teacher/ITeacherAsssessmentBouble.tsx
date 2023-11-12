import React from "react";

import { IAssessmentName } from "models/Activity/IActivity";
import { TAssessment } from "models/Activity/TAssessment";

import ActivityBouble from "../ActivityBouble";
import LoadingBouble from "../LoadingBouble";
import TeacherActivityBoubleChild from "./TeacherActivityBoubleChild";

export interface ITeacherAsssessmentBoubleProps {
    title: string;
    name: IAssessmentName;
    lessonId: number;
    info: TAssessment | undefined | null;
}

const ITeacherAsssessmentBouble = ({ title, name, lessonId, info }: ITeacherAsssessmentBoubleProps) => {
    if (info === undefined) {
        return <LoadingBouble title={title} />;
    }

    return (
        <ActivityBouble title={title}>
            <TeacherActivityBoubleChild name={name} lessonId={lessonId} info={info} />
        </ActivityBouble>
    );
};

export default ITeacherAsssessmentBouble;
