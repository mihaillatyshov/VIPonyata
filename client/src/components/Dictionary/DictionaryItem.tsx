import React from "react";
import { TDictionaryItem } from "models/TDictionary";

interface DictionaryItemProps {
    item: TDictionaryItem;
}

const DictionaryItem = ({ item }: DictionaryItemProps) => {
    return (
        <div className="flex-table flex-table-row" role="rowgroup">
            <div className="flex-row first" role="cell">
                <img src={item.img ?? "/svg/NoImg.svg"} alt="IMG" className="table-img" />
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
