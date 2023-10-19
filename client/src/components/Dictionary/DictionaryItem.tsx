import React from "react";

import { TDictionaryItem } from "models/TDictionary";
import { isStudent, useGetAuthorizedUserSafe } from "redux/funcs/user";

import DictionaryAssociation from "./DictionaryAssociation";
import DictionaryImage from "./DictionaryImage";

interface DictionaryItemProps {
    item: TDictionaryItem;
}

const DictionaryItem = ({ item }: DictionaryItemProps) => {
    const user = useGetAuthorizedUserSafe();

    return (
        <div className="flex-table flex-table-row" role="rowgroup">
            <div className="flex-row first" role="cell">
                <DictionaryImage initValue={item.img} className="" dictionary_id={item.id} onSuccessSave={() => {}} />
                {isStudent(user.userData) ? (
                    <DictionaryAssociation
                        initValue={item.association}
                        dictionary_id={item.id}
                        onSuccessSave={() => {}}
                    />
                ) : (
                    <></>
                )}
            </div>
            <div className="flex-row" role="cell">
                <div className="d-flex w-100 h-100 align-items-center justify-content-center fs-5">{item.ru}</div>
            </div>
            <div className="flex-row" role="cell">
                <div className="d-flex w-100 h-100 align-items-center justify-content-center fs-5">{item.word_jp}</div>
            </div>
            <div className="flex-row" role="cell">
                <div className="d-flex w-100 h-100 align-items-center justify-content-center fs-5">{item.char_jp}</div>
            </div>
        </div>
    );
};

export default DictionaryItem;
