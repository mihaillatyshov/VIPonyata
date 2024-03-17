import React from "react";

import AutosizeDiv from "libs/AutosizeDiv";
import { TAssessmentFillSpacesExistsEmpty } from "models/Activity/Items/TAssessmentItems";

import { useDroppable } from "@dnd-kit/core";

import Draggable, { FieldData } from "./Draggable";

interface DroppableProps {
    id: number;
    longestStr: string;
    str: string | null;
}

const Droppable = ({ id, longestStr, str }: DroppableProps) => {
    const data: FieldData = { fieldId: id, type: "answer" };
    const { setNodeRef, isOver } = useDroppable({
        id: `${id}`,
        data: data,
    });

    return (
        <div ref={setNodeRef}>
            <div className={`d-flex dnd__droppable-wrapper ${isOver ? "dnd__droppable-over" : ""}`}>
                {str ? (
                    <Draggable id={id} str={str} type="answer" longestStr={longestStr} />
                ) : (
                    <div className="d-flex dnd__droppable">
                        <AutosizeDiv
                            value={TAssessmentFillSpacesExistsEmpty}
                            valueToCalcSize={longestStr}
                            inputClassName="prevent-select text-center"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Droppable;
