import React from "react";

import CSS from "csstype";
import { LexisImages, LexisTaskName } from "models/Activity/ILexis";

import { useSortable } from "@dnd-kit/sortable";
import { CSS as DNDCSS } from "@dnd-kit/utilities";

import styles from "./StylesLexisProcessing.module.css";

interface SortableTaskItemProps {
    taskName: LexisTaskName;
    isSelected: boolean;
    setSelected: (taskName: LexisTaskName, checked: boolean) => void;
}

const SortableTaskItem = ({ taskName, isSelected, setSelected }: SortableTaskItemProps) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: taskName,
        data: { taskName },
    });

    const style: CSS.Properties = {
        transform: DNDCSS.Transform.toString(transform),
        transition,
    };

    const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelected(taskName, e.target.checked);
    };

    return (
        <div style={style} className={`d-flex flex-column justify-content-center ${styles.task}`}>
            <div className={styles.taskImgWrapper} ref={setNodeRef} {...attributes} {...listeners}>
                <img className={styles.taskImg} src={LexisImages[taskName]} alt={taskName} />
            </div>
            <div className="form-check mx-auto">
                <input
                    className="form-check-input"
                    type="checkbox"
                    id={taskName}
                    checked={isSelected}
                    onChange={onChangeHandler}
                />
                <label className="form-check-label" htmlFor={taskName}>
                    {taskName}
                </label>
            </div>
        </div>
    );
};

export default SortableTaskItem;
