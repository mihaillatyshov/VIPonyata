import React from "react";

import { useAppDispatch, useAppSelector } from "redux/hooks";
import { selectDrilling, setLexisDoneTask, setLexisInfo, setLexisItems } from "redux/slices/drillingSlice";

import StudentLexisPage from "../StudentLexisPage";

const StudentDrillingPage = () => {
    const dispatch = useAppDispatch();
    const drilling = useAppSelector(selectDrilling);

    const setDrillingInfoHandler = (info: any) => {
        dispatch(setLexisInfo(info));
    };

    const setDrillingItemsHandler = (items: any) => {
        dispatch(setLexisItems(items));
    };

    const setDrillingDoneTaskHandler = (doneTasks: any) => {
        dispatch(setLexisDoneTask(doneTasks));
    };

    return (
        <StudentLexisPage
            name="drilling"
            lexis={drilling}
            setLexisInfoCallback={setDrillingInfoHandler}
            setLexisItemsCallback={setDrillingItemsHandler}
            setLexisDoneTaskCallback={setDrillingDoneTaskHandler}
        />
    );
};

export default StudentDrillingPage;
