import React from "react";

import styles from "./Style.module.css";
import { TAssessmentTaskName, assessmentTaskRusNameAliases } from "models/Activity/Items/TAssessmentItems";

export interface TeacherAssessmentTypeProps<T> {
    data: T;
    onChangeTask: (taskId: number, data: T) => void;
    taskId: number;
}

interface TeacherAssessmentTypeBaseProps {
    taskId: number;
    taskName: TAssessmentTaskName;
    removeTask: (taskId: number) => void;
    children: React.ReactNode;
}

const TeacherAssessmentTypeBase = ({ taskId, taskName, removeTask, children }: TeacherAssessmentTypeBaseProps) => {
    return (
        <div className={styles.base}>
            <div className={styles.baseTopBar}>
                <div className={styles.baseTopBarTitle}>{assessmentTaskRusNameAliases[taskName]}</div>
                <div className="ms-auto">
                    <i
                        className="bi bi-x font-icon-height-0 font-icon-button-danger"
                        style={{ fontSize: "2em" }}
                        onClick={() => removeTask(taskId)}
                    />
                </div>
            </div>
            <div className={styles.baseBody}>{children}</div>
        </div>
    );
};

export default TeacherAssessmentTypeBase;
