import React from "react";

import CSS from "csstype";

import { useDroppable } from "@dnd-kit/core";

import styles from "../StyleAssessmentType.module.css";
import Draggable, { FieldData } from "./Draggable";

interface DroppableProps {
    id: number;
    width: number;
    str: string | null;
}

const Droppable = ({ id, width, str }: DroppableProps) => {
    const data: FieldData = { fieldId: id, type: "answer" };
    const { setNodeRef, isOver } = useDroppable({
        id: `${id}`,
        data: data,
    });

    const style: CSS.Properties = {
        minWidth: `calc(${width}em * 0.8)`,
        maxWidth: `calc(${width}em * 0.8)`,
    };

    const className = `d-flex mt-1 ${isOver ? styles.fillSpaceExistsDroppableOver : ""} ${
        !str ? styles.fillSpaceExistsDroppable : styles.fillSpaceExistsDroppableNone
    }`;

    return (
        <div ref={setNodeRef} className={className} style={style}>
            <div className="d-flex mx-auto">
                {str ? <Draggable id={id} str={str} type="answer" width={width} /> : "Пусто"}
            </div>
        </div>
    );
};

export default Droppable;
