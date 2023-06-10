import React, { useState } from "react";
import { StudentAssessmentTypeProps } from "../StudentAssessmentTypeProps";
import { TAssessmentCreateSentence, TAssessmentSentenceOrder } from "models/Activity/Items/TAssessmentItems";
import DragItem from "./DragItem";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";

interface MoveDragAndDropProps<T extends TAssessmentSentenceOrder | TAssessmentCreateSentence>
    extends StudentAssessmentTypeProps<T> {
    flexType: "row" | "column";
}

const MoveDragAndDrop = <T extends TAssessmentSentenceOrder>({ data, taskId, flexType }: MoveDragAndDropProps<T>) => {
    const dispatch = useAppDispatch();
    const [selectedFieldId, setSelectedFieldId] = useState<number | undefined>(undefined);
    const [fakeFieldId, setFakeFieldId] = useState<number | undefined>(undefined);

    const accept = `dnd_ac_${taskId}`;
    const flexTypeClassName = `flex-${flexType}`;

    const updateFields = () => {
        console.log("END", fakeFieldId, selectedFieldId);
        if (selectedFieldId !== undefined && fakeFieldId !== undefined) {
            const fieldText = data.parts.splice(selectedFieldId, 1)[0];
            const insertId = fakeFieldId > selectedFieldId ? fakeFieldId - 1 : fakeFieldId;
            console.log(fieldText, insertId);
            data.parts.splice(insertId, 0, fieldText);
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

export default MoveDragAndDrop;
