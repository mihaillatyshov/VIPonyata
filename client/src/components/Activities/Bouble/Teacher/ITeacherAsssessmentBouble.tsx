import React from "react";
import LoadingBouble from "../LoadingBouble";
import ActivityBouble from "../ActivityBouble";
import { TAssessment } from "models/Activity/TAssessment";
import { AssessmentName } from "components/Activities/ActivityUtils";
import TeacherActivityBoubleChild from "./TeacherActivityBoubleChild";

export interface ITeacherAsssessmentBoubleProps {
    title: string;
    name: AssessmentName;
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
