import React from "react";
import { CSS as DNDCSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import CSS from "csstype";
import { LexisImages, LexisTaskName } from "models/Activity/ILexis";

import styles from "./StylesCreatePage.module.css";

interface SortableTaskItemProps {
    taskName: LexisTaskName;
    isSelected: boolean;
}

const SortableTaskItem = ({ taskName, isSelected }: SortableTaskItemProps) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: taskName,
    });

    const style: CSS.Properties = {
        transform: DNDCSS.Transform.toString(transform),
        transition,
    };

    return (
        <div style={style} className={`d-flex flex-column justify-content-center ${styles.task}`}>
            <div className={styles.taskImgWrapper} ref={setNodeRef} {...attributes} {...listeners}>
                <img className={styles.taskImg} src={LexisImages[taskName]} alt={taskName} />
            </div>
            <div className="form-check mx-auto">
                <input className="form-check-input" type="checkbox" id={taskName} />
                <label className="form-check-label" htmlFor={taskName}>
                    {taskName}
                </label>
            </div>
        </div>
    );
};

export default SortableTaskItem;
