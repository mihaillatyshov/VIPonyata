import React, { useLayoutEffect } from "react";
import { AjaxGet } from "libs/ServerAPI";
import { TDictionary } from "models/TDictionary";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { selectDictionary, setDictionary } from "redux/slices/dictionarySlice";
import { LoadStatus } from "libs/Status";
import Loading from "components/Common/Loading";
import ErrorPage from "components/ErrorPages/ErrorPage";
import DictionaryItem from "./DictionaryItem";

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

    return (
        <div className="container">
            <div className="table-container" role="table" aria-label="Destinations">
                <div className="flex-table header" role="rowgroup">
                    <div className="flex-row first" role="columnheader">
                        Картинка
                    </div>
                    <div className="flex-row" role="columnheader">
                        Перевод
                    </div>
                    <div className="flex-row" role="columnheader">
                        Слово
                    </div>
                    <div className="flex-row" role="columnheader">
                        Символ
                    </div>
                </div>
                {dictionary.items.map((item) => (
                    <DictionaryItem key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
};

export default TeacherDictionaryPage;
