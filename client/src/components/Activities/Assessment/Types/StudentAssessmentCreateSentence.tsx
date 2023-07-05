import React, { useMemo } from "react";
import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";
import { TAssessmentCreateSentence } from "models/Activity/Items/TAssessmentItems";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS as DNDCSS } from "@dnd-kit/utilities";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";
import { useAppDispatch } from "redux/hooks";
import CSS from "csstype";
import styles from "./StyleAssessmentType.module.css";

const SortableItem = ({
    id,
    word,
    customData,
    width,
}: {
    id: string;
    word: string;
    customData: any;
    width: number;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: id,
        data: customData,
    });

    const style: CSS.Properties = {
        transform: DNDCSS.Transform.toString(transform),
        transition,
        minWidth: `calc(${width}em * 0.75)`,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`d-flex ${styles.createSentenceItem}`}
        >
            {word}
        </div>
    );
};

const StudentAssessmentCreateSentence = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentCreateSentence>) => {
    const dispatch = useAppDispatch();

    const localParts = useMemo(() => {
        return data.parts.map((item, id) => ({
            word_id: `${item}_${id}`,
            word: item,
            arrayId: id,
        }));
    }, [data.parts]);

    const itemWidth = Math.max(...localParts.map((item) => item.word.length), 3);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over === null) return;

        if (active?.data?.current?.arrayId !== over?.data?.current?.arrayId) {
            data.parts = arrayMove(
                data.parts,
                active.data.current?.arrayId as number,
                over.data.current?.arrayId as number
            );
            dispatch(setAssessmentTaskData({ id: taskId, data: data }));
        }
    };

    return (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="container">
                <SortableContext items={localParts.map((item) => item.word_id)} strategy={rectSortingStrategy}>
                    <div className="d-flex flex-wrap gap-3">
                        {localParts.map((item) => (
                            <SortableItem
                                key={item.word_id}
                                id={item.word_id}
                                word={item.word}
                                customData={{ arrayId: item.arrayId }}
                                width={itemWidth}
                            />
                        ))}
                    </div>
                </SortableContext>
            </div>
        </DndContext>
    );
};

export default StudentAssessmentCreateSentence;
