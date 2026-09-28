import React from "react";

import {
    processingAliases,
    TAliasProp,
} from "components/Activities/Assessment/ProcessingPage/AssessmentProcessingUtils";
import { TeacherAssessmentTypeProps } from "components/Activities/Assessment/ProcessingPage/Types/TeacherAssessmentTypeBase";
import {
    TAssessmentItemBase,
    TAssessmentTaskName,
    TGetAssessmentTeacherTypeByName,
    TTeacherAssessmentAnyItem,
} from "models/Activity/Items/TAssessmentItems";

type TTeacherAliasProp<T extends TAssessmentItemBase> = (props: TeacherAssessmentTypeProps<T>) => React.ReactElement;

type TTeacherAliases = {
    [key in TAssessmentTaskName]: TTeacherAliasProp<TGetAssessmentTeacherTypeByName[key]>;
};

const teacherAliases: TTeacherAliases = processingAliases;

interface TeacherTaskEditorProps {
    task: TTeacherAssessmentAnyItem;
    onChangeTask: (task: TTeacherAssessmentAnyItem) => void;
    taskUUID?: string;
}

/** Редактор задания assessment нужного типа (тот же, что в редакторе активности). */
const TeacherTaskEditor = ({ task, onChangeTask, taskUUID = "task-bank-editor" }: TeacherTaskEditorProps) => {
    const component = teacherAliases[task.name] as TAliasProp<TTeacherAssessmentAnyItem>;
    return React.createElement(component, { data: task, onChangeTask, taskUUID });
};

export default TeacherTaskEditor;
