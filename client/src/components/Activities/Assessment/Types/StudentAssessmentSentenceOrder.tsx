import React from "react";
import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";
import { TAssessmentSentenceOrder } from "models/Activity/Items/TAssessmentItems";
import { useAppDispatch } from "redux/hooks";
import { arrayMove } from "@dnd-kit/sortable";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";
import SortableOrder from "./DndSortable/SortableOrder";
import { DragEndEvent } from "@dnd-kit/core";

const StudentAssessmentSentenceOrder = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentSentenceOrder>) => {
    const dispatch = useAppDispatch();

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

    return <SortableOrder handleDragEnd={handleDragEnd} data={data} order={"vertical"} />;
};

export default StudentAssessmentSentenceOrder;
