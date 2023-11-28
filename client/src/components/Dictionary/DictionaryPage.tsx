import React, { useLayoutEffect } from "react";

import Loading from "components/Common/Loading";
import PageTitle from "components/Common/PageTitle";
import ErrorPage from "components/ErrorPages/ErrorPage";
import { AjaxGet } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { TDictionary } from "models/TDictionary";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { selectDictionary, setDictionary } from "redux/slices/dictionarySlice";

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

    // return (
    //     <div className="container">
    //         <div className="table-container" role="table" aria-label="Destinations">
    //             <div className="flex-table header" role="rowgroup">
    //                 <div className="flex-row first" role="columnheader">
    //                     れんそう
    //                 </div>
    //                 <div className="flex-row" role="columnheader">
    //                     ほんやく
    //                 </div>
    //                 <div className="flex-row" role="columnheader">
    //                     ことば
    //                 </div>
    //                 <div className="flex-row" role="columnheader">
    //                     かんじ
    //                 </div>
    //             </div>
    //             {dictionary.items.map((item) => (
    //                 <DictionaryItem key={item.id} item={item} />
    //             ))}
    //         </div>
    //     </div>
    // );
    return (
        <div className="container">
            <PageTitle title="じしょ" />

            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-2 row-cols-xl-3 g-3">
                {dictionary.items.map((item) => (
                    <DictionaryItem key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
};

export default TeacherDictionaryPage;
