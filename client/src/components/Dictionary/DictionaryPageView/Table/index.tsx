import React from "react";

import { TDictionary } from "models/TDictionary";

import { DictionaryItem } from "./DictionaryItem";

type DictionaryPageViewTableProps = {
    dictionary: TDictionary;
};

export const DictionaryPageViewTable = ({ dictionary }: DictionaryPageViewTableProps) => {
    return (
        <div className="container">
            <div className="table-container" role="table" aria-label="Destinations">
                <div className="flex-table header" role="rowgroup">
                    <div className="flex-row first" role="columnheader">
                        れんそう
                    </div>
                    <div className="flex-row" role="columnheader">
                        ほんやく
                    </div>
                    <div className="flex-row" role="columnheader">
                        ことば
                    </div>
                    <div className="flex-row" role="columnheader">
                        かんじ
                    </div>
                </div>
                {dictionary.map((item) => (
                    <DictionaryItem key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
};
