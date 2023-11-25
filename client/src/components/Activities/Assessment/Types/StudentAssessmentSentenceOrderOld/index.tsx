import React, { useState } from "react";

import { TAssessmentSentenceOrder } from "models/Activity/Items/TAssessmentItems";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";

import { StudentAssessmentTypeProps } from "../StudentAssessmentTypeProps";
import DragItem from "./DragItem";

const StudentAssessmentSentenceOrder = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentSentenceOrder>) => {
    const dispatch = useAppDispatch();
    const [selectedFieldId, setSelectedFieldId] = useState<number | undefined>(undefined);
    const [fakeFieldId, setFakeFieldId] = useState<number | undefined>(undefined);

    const accept = `dnd_ac_${taskId}`;
    const flexTypeClassName = "flex-column";

    const updateFields = () => {
        if (selectedFieldId !== undefined && fakeFieldId !== undefined) {
            const sentence = data.parts.splice(selectedFieldId, 1)[0];
            const insertId = fakeFieldId > selectedFieldId ? fakeFieldId - 1 : fakeFieldId;
            data.parts.splice(insertId, 0, sentence);
        }
        setSelectedFieldId(undefined);
        setFakeFieldId(undefined);
        dispatch(setAssessmentTaskData({ id: taskId, data: data }));
    };

    return (
        <div className={`d-flex ${flexTypeClassName}`}>
            {data.parts.map((sentence: string, i: number) => (
                <div key={i} className={`d-flex ${flexTypeClassName}`}>
                    <DragItem
                        id={i}
                        text={sentence}
                        accept={accept}
                        selectedFieldId={selectedFieldId}
                        setSelectedFieldId={setSelectedFieldId}
                        fakeFieldId={fakeFieldId}
                        setFakeFieldId={setFakeFieldId}
                        updateFields={updateFields}
                        selectedFieldText={selectedFieldId !== undefined ? data.parts[selectedFieldId] : undefined}
                    />
                </div>
            ))}
            {selectedFieldId !== undefined ? (
                <DragItem
                    id={data.parts.length}
                    accept={accept}
                    selectedFieldId={selectedFieldId}
                    setSelectedFieldId={setSelectedFieldId}
                    fakeFieldId={fakeFieldId}
                    setFakeFieldId={setFakeFieldId}
                    updateFields={updateFields}
                    selectedFieldText={selectedFieldId !== undefined ? data.parts[selectedFieldId] : undefined}
                />
            ) : (
                <div
                    style={{
                        minHeight: "1rem",
                    }}
                ></div>
            )}
        </div>
    );
};

export default StudentAssessmentSentenceOrder;
