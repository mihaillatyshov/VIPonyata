import React from "react";

import styles from "./Style.module.css";
import { TAssessmentTaskName, assessmentTaskRusNameAliases } from "models/Activity/Items/TAssessmentItems";
import { PyError } from "libs/PyError";

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
    errors?: PyError[];
}

const TeacherAssessmentTypeBase = ({
    taskId,
    taskName,
    removeTask,
    children,
    errors,
}: TeacherAssessmentTypeBaseProps) => {
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
            <div className={styles.baseBody}>
                {children}
                <div className={errors !== undefined ? "mt-3" : ""}>
                    {errors?.map((error, i) => (
                        <div key={i} className="text-danger">
                            {error.msg}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TeacherAssessmentTypeBase;
