import React from "react";
import {
    selectHieroglyph,
    setHieroglyphDoneTask,
    setHieroglyphInfo,
    setHieroglyphItems,
} from "redux/slices/hieroglyphSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import StudentLexisPage from "../StudentLexisPage";

const StudentHieroglyphPage = () => {
    const dispatch = useAppDispatch();
    const hieroglyph = useAppSelector(selectHieroglyph);

    const setHieroglyphInfoHandler = (info: any) => {
        dispatch(setHieroglyphInfo(info));
    };

    const setHieroglyphItemsHandler = (items: any) => {
        dispatch(setHieroglyphItems(items));
    };

    const setHieroglyphDoneTaskHandler = (doneTasks: any) => {
        dispatch(setHieroglyphDoneTask(doneTasks));
    };

    return (
        <StudentLexisPage
            name="hieroglyph"
            lexis={hieroglyph}
            setLexisInfoCallback={setHieroglyphInfoHandler}
            setLexisItemsCallback={setHieroglyphItemsHandler}
            setLexisDoneTaskCallback={setHieroglyphDoneTaskHandler}
        />
    );
};

export default StudentHieroglyphPage;
