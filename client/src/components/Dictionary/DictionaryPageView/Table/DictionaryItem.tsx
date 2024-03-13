import React from "react";

import DictionaryAssociation from "components/Dictionary/DictionaryAssociation";
import { TDictionaryItem } from "models/TDictionary";
import { isStudent, useGetAuthorizedUserSafe } from "redux/funcs/user";

interface DictionaryItemProps {
    item: TDictionaryItem;
}

export const DictionaryItem = ({ item }: DictionaryItemProps) => {
    const user = useGetAuthorizedUserSafe();

    return (
        <div className="flex-table flex-table-row" role="rowgroup">
            <div className="flex-row" role="cell">
                {isStudent(user.userData) ? (
                    <DictionaryAssociation
                        initValue={item.association}
                        dictionary_id={item.id}
                        onSuccessSave={() => {}}
                        className="dictionary__table-association"
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
