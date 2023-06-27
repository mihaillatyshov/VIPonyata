import React, { useMemo } from "react";
import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";
import { TAssessmentCreateSentence } from "models/Activity/Items/TAssessmentItems";
import MoveDragAndDrop from "./MoveDragAndDrop";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";
import { useAppDispatch } from "redux/hooks";
import { Card } from "react-bootstrap";

const SortableItem = ({ id, word, customData }: { id: string; word: string; customData: any }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: id, data: customData });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    console.log(transform);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="border border-primary d-flex flex-grow-1"
        >
            <Card body>{word}</Card>
        </div>
    );
};

const StudentAssessmentCreateSentence = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentCreateSentence>) => {
    const dispatch = useAppDispatch();

    const localParts = useMemo(() => {
        console.log("memoUpdate");
        return data.parts.map((item, id) => ({
            word_id: `${item}_${id}`,
            word: item,
            arrayId: id,
        }));
    }, [data.parts]);
    console.log(localParts);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        console.log(active, over);
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
                    <div className="">
                        {localParts.map((item) => (
                            <SortableItem
                                key={item.word_id}
                                id={item.word_id}
                                word={item.word}
                                customData={{ arrayId: item.arrayId }}
                            />
                        ))}
                    </div>
                </SortableContext>
            </div>
        </DndContext>
    );

    return <MoveDragAndDrop data={data} taskId={taskId} flexType="row" />;
};

export default StudentAssessmentCreateSentence;
