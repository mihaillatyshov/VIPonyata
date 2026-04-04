import { ReactMarkdownWithHtml } from "components/Common/ReactMarkdownWithHtml";
import CSS from "csstype";

import { useDraggable } from "@dnd-kit/core";
import { CSS as DNDCSS } from "@dnd-kit/utilities";

export type DraggableType = "answer" | "inputs";

export interface FieldData {
    fieldId: number;
    type: DraggableType;
}

export const isFieldData = (data: any): data is FieldData => data !== undefined;

interface DraggableProps {
    id: number;
    str: string;
    longestStr: string;
    type: DraggableType;
}

const DraggableContent = ({ str }: { str: string }) => {
    return (
        <div className="prevent-select md-last-no-margin student-assessment-fill-spaces-exists__draggable-content">
            <ReactMarkdownWithHtml>{str}</ReactMarkdownWithHtml>
        </div>
    );
};

const Draggable = ({ id, str, longestStr, type }: DraggableProps) => {
    const data: FieldData = { fieldId: id, type };
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `${str}_${id}`,
        data,
    });

    const style: CSS.Properties = {
        transform: DNDCSS.Translate.toString(transform),
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="d-flex dnd__sortable-item student-assessment-fill-spaces-exists__draggable"
        >
            <div className="student-assessment-fill-spaces-exists__draggable-sizer" aria-hidden="true">
                <DraggableContent str={longestStr} />
            </div>
            <DraggableContent str={str} />
        </div>
    );
};

export default Draggable;
