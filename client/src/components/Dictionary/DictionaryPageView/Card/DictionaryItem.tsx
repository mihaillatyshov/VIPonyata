import React from "react";

import DictionaryAssociation from "components/Dictionary/DictionaryAssociation";
import DictionaryImage from "components/Dictionary/DictionaryImage";
import { TDictionaryItem } from "models/TDictionary";
import { isStudent, useGetAuthorizedUserSafe } from "redux/funcs/user";

interface DictionaryItemProps {
    item: TDictionaryItem;
}

const DictionaryItem = ({ item }: DictionaryItemProps) => {
    const user = useGetAuthorizedUserSafe();

    return (
        <div className="">
            <div className="dictionary__card">
                <div className="directory__card-content">
                    <div className="dictionary__card-img-block">
                        <DictionaryImage
                            initValue={item.img}
                            className="dictionary__card-img d-flex"
                            dictionary_id={item.id}
                            onSuccessSave={() => {}}
                        />
                    </div>
                    <div className="dictionary__card-word-block">
                        <div className="dictionary__card-word ru">{item.ru}</div>
                        <div className="dictionary__card-word w_jp">{item.word_jp}</div>
                        <div className="dictionary__card-word c_jp">{item.char_jp}</div>
                    </div>
                </div>
                <div className="dictionary__card-association-block">
                    {isStudent(user.userData) ? (
                        <DictionaryAssociation
                            initValue={item.association}
                            dictionary_id={item.id}
                            onSuccessSave={() => {}}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default DictionaryItem;
