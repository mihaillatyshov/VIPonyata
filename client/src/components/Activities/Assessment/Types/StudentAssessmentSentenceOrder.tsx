import { useSetAssessmentTaskData } from "components/Activities/Assessment/StudentAssessmentTaskContext";
import { TAssessmentSentenceOrder } from "models/Activity/Items/TAssessmentItems";

import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import SortableOrder from "./DndSortable/SortableOrder";
import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentSentenceOrder = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentSentenceOrder>) => {
    const setAssessmentTaskData = useSetAssessmentTaskData();

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over === null) return;

        if (active?.data?.current?.arrayId !== over?.data?.current?.arrayId) {
            const newParts = arrayMove(
                data.parts,
                active.data.current?.arrayId as number,
                over.data.current?.arrayId as number,
            );
            setAssessmentTaskData({ id: taskId, data: { ...data, parts: newParts } });
            console.log("new order", newParts);
        }
    };

    return <SortableOrder handleDragEnd={handleDragEnd} data={data} order={"vertical"} />;
};

export default StudentAssessmentSentenceOrder;
