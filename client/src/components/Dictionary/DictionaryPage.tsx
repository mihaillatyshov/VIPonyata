import React, { useLayoutEffect } from "react";

import Loading from "components/Common/Loading";
import PageTitle from "components/Common/PageTitle";
import ErrorPage from "components/ErrorPages/ErrorPage";
import { AjaxGet } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { TDictionary } from "models/TDictionary";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { selectDictionary, setDictionary } from "redux/slices/dictionarySlice";

import { DictionaryPageViewTable } from "./DictionaryPageView/Table";

const TeacherDictionaryPage = () => {
    const { dictionary } = useAppSelector(selectDictionary);
    const dispatch = useAppDispatch();

    const fetchDictionary = () => {
        AjaxGet<{ dictionary: TDictionary }>({ url: "/api/dictionary" })
            .then((json) => {
                dispatch(setDictionary({ loadStatus: LoadStatus.DONE, items: json.dictionary }));
            })
            .catch(() => {
                dispatch(setDictionary({ loadStatus: LoadStatus.ERROR }));
            });
    };

    useLayoutEffect(() => {
        fetchDictionary();

        return () => {
            dispatch(setDictionary({ loadStatus: LoadStatus.NONE }));
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (dictionary.loadStatus === LoadStatus.ERROR) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Не удалось загрузить словарь"
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (dictionary.loadStatus !== LoadStatus.DONE) {
        return <Loading />;
    }

    // TODO: Select dictionary view type
    return (
        <div className="container">
            <PageTitle className="ap-japanesefont" title="じしょ" />

            <DictionaryPageViewTable dictionary={dictionary.items} />
        </div>
    );
};

export default TeacherDictionaryPage;
