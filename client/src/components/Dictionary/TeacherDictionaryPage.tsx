import React from "react";
import { AjaxGet } from "libs/ServerAPI";
import { TDictionary } from "models/TDictionary";
import { useAppDispatch } from "redux/hooks";
import { setDictionary } from "redux/slices/dictionarySlice";
import { LoadStatus } from "libs/Status";

const TeacherDictionaryPage = () => {
    const dispatch = useAppDispatch();
    const fetchDictionary = () => {
        AjaxGet<TDictionary>({ url: "/api/dictionary" }).then((json) => {
            dispatch(setDictionary({ loadStatus: LoadStatus.DONE, items: json }));
        });
    };

    return <div className="container">TeacherDictionaryPage</div>;
};

export default TeacherDictionaryPage;
