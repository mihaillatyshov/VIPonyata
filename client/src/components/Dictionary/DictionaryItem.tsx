import React from "react";
import { TDictionaryItem } from "models/TDictionary";

interface DictionaryItemProps {
    item: TDictionaryItem;
}

const DictionaryItem = ({ item }: DictionaryItemProps) => {
    return (
        <div className="flex-table flex-table-row" role="rowgroup">
            <div className="flex-row first" role="cell">
                <img src={item.img ?? "/svg/NoImg.svg"} alt="IMG" className="table-img" />{" "}
            </div>
            <div className="flex-row" role="cell">
                {item.ru}
            </div>
            <div className="flex-row" role="cell">
                {item.word_jp}
            </div>
            <div className="flex-row" role="cell">
                {item.char_jp}
            </div>
        </div>
    );
};

export default DictionaryItem;
