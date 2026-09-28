import React from "react";

import { dictionaryQueries } from "api/dictionary";
import Loading from "components/Common/Loading";
import PageTitle from "components/Common/PageTitle";
import ErrorPage from "components/ErrorPages/ErrorPage";

import { useQuery } from "@tanstack/react-query";

import { DictionaryPageViewTable } from "./DictionaryPageView/Table";

const TeacherDictionaryPage = () => {
    const dictionaryQuery = useQuery(dictionaryQueries.list());

    if (dictionaryQuery.isError) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Не удалось загрузить словарь"
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (dictionaryQuery.data === undefined) {
        return <Loading />;
    }

    // TODO: Select dictionary view type
    return (
        <div className="container">
            <PageTitle title="じしょ" />

            <DictionaryPageViewTable dictionary={dictionaryQuery.data} />
        </div>
    );
};

export default TeacherDictionaryPage;
