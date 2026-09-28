import { createContext, useContext } from "react";

export type SetAssessmentTaskData = (payload: { id: number; data: any }) => void;

/** Запись ответа ученика в задание `id`; предоставляет страница прохождения (урок или домашка). */
export const StudentAssessmentTaskContext = createContext<SetAssessmentTaskData | null>(null);

export const useSetAssessmentTaskData = (): SetAssessmentTaskData => {
    const setTaskData = useContext(StudentAssessmentTaskContext);
    if (setTaskData === null) {
        throw new Error("useSetAssessmentTaskData must be used inside StudentAssessmentTaskContext");
    }
    return setTaskData;
};
