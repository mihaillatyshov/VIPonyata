import React from "react";
import { selectDrilling, setDrillingDoneTask, setDrillingInfo, setDrillingItems } from "redux/slices/drillingSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import StudentLexisPage from "../StudentLexisPage";

const StudentDrillingPage = () => {
    const dispatch = useAppDispatch();
    const drilling = useAppSelector(selectDrilling);

    const setDrillingInfoHandler = (info: any) => {
        dispatch(setDrillingInfo(info));
    };

    const setDrillingItemsHandler = (items: any) => {
        dispatch(setDrillingItems(items));
    };

    const setDrillingDoneTaskHandler = (doneTasks: any) => {
        dispatch(setDrillingDoneTask(doneTasks));
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
