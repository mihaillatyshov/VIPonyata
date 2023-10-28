import React from "react";

import { useAppDispatch, useAppSelector } from "redux/hooks";
import { selectHieroglyph, setLexisDoneTask, setLexisInfo, setLexisItems } from "redux/slices/hieroglyphSlice";

import StudentLexisPage from "../StudentLexisPage";

const StudentHieroglyphPage = () => {
    const dispatch = useAppDispatch();
    const hieroglyph = useAppSelector(selectHieroglyph);

    const setHieroglyphInfoHandler = (info: any) => {
        dispatch(setLexisInfo(info));
    };

    const setHieroglyphItemsHandler = (items: any) => {
        dispatch(setLexisItems(items));
    };

    const setHieroglyphDoneTaskHandler = (doneTasks: any) => {
        dispatch(setLexisDoneTask(doneTasks));
    };

    return (
        <StudentLexisPage
            name="hieroglyph"
            lexis={hieroglyph}
            title="Иероглифы"
            setLexisInfoCallback={setHieroglyphInfoHandler}
            setLexisItemsCallback={setHieroglyphItemsHandler}
            setLexisDoneTaskCallback={setHieroglyphDoneTaskHandler}
        />
    );
};

export default StudentHieroglyphPage;
