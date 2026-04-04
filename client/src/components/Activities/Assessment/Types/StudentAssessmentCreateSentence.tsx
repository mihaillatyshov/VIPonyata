import { useEffect, useMemo, useState } from "react";

import { FindMaxStr, fixRubyStr } from "libs/Autisize";
import { TAssessmentCreateSentence } from "models/Activity/Items/TAssessmentItems";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentTaskData } from "redux/slices/assessmentSlice";

import {
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";

import { isFieldData } from "./StudentAssessmentFillSpacesExists/Draggable";
import Droppable from "./StudentAssessmentFillSpacesExists/Droppable";
import InputsField from "./StudentAssessmentFillSpacesExists/InputsField";
import { StudentAssessmentTypeProps } from "./StudentAssessmentTypeProps";

const StudentAssessmentCreateSentence = ({ data, taskId }: StudentAssessmentTypeProps<TAssessmentCreateSentence>) => {
    const dispatch = useAppDispatch();
    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor), useSensor(KeyboardSensor));

    const [answers, setAnswers] = useState<(string | null)[]>(() => Array(data.parts.length).fill(null));
    const [inputs, setInputs] = useState<string[]>(() => [...data.parts]);

    useEffect(() => {
        setAnswers(Array(data.parts.length).fill(null));
        setInputs([...data.parts]);
    }, [taskId]);

    const syncTaskData = (nextAnswers: (string | null)[], nextInputs: string[]) => {
        const orderedFilledParts = nextAnswers.filter((item): item is string => item !== null);
        const nextParts = [...orderedFilledParts, ...nextInputs];
        dispatch(setAssessmentTaskData({ id: taskId, data: { ...data, parts: nextParts } }));
    };

    const handleAnsInp = (answerId: number) => {
        const currentAnswer = answers[answerId];
        if (currentAnswer === null) {
            return;
        }

        const nextAnswers = [...answers];
        const nextInputs = [...inputs, currentAnswer];
        nextAnswers[answerId] = null;

        setAnswers(nextAnswers);
        setInputs(nextInputs);
        syncTaskData(nextAnswers, nextInputs);
    };

    const handleInpAns = (inputId: number, answerId: number) => {
        const nextInputs = [...inputs];
        const nextAnswers = [...answers];

        const selectedInput = nextInputs.splice(inputId, 1)[0];
        const currentAnswer = nextAnswers[answerId];

        if (currentAnswer !== null) {
            nextInputs.push(currentAnswer);
        }
        nextAnswers[answerId] = selectedInput;

        setAnswers(nextAnswers);
        setInputs(nextInputs);
        syncTaskData(nextAnswers, nextInputs);
    };

    const handleAnsAns = (fromId: number, toId: number) => {
        const nextAnswers = [...answers];
        [nextAnswers[fromId], nextAnswers[toId]] = [nextAnswers[toId], nextAnswers[fromId]];

        setAnswers(nextAnswers);
        syncTaskData(nextAnswers, inputs);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const activeData = active.data.current;
        if (!isFieldData(activeData)) {
            return;
        }

        if (over === null) {
            if (activeData.type === "answer") {
                handleAnsInp(activeData.fieldId);
            }
            return;
        }

        const overData = over.data.current;
        if (!isFieldData(overData)) {
            return;
        }

        if (activeData.type === "inputs" && overData.type === "answer") {
            handleInpAns(activeData.fieldId, overData.fieldId);
        } else if (activeData.type === "answer" && overData.type === "answer") {
            handleAnsAns(activeData.fieldId, overData.fieldId);
        }
    };

    const longestStr = useMemo(
        () => FindMaxStr([...inputs, ...answers].filter((item) => item !== null) as string[], fixRubyStr),
        [answers, inputs],
    );

    return (
        <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
            <div className="student-assessment-fill-spaces__container">
                <InputsField inputFields={inputs} longestStr={longestStr} />
                <div className="student-assessment-fill-spaces student-assessment-create-sentence__answers">
                    {answers.map((answer, fieldId) => (
                        <Droppable key={fieldId} id={fieldId} longestStr={longestStr} str={answer} />
                    ))}
                </div>
            </div>
        </DndContext>
    );
};

export default StudentAssessmentCreateSentence;
