import React from "react";

import { TDictionary } from "models/TDictionary";

import DictionaryItem from "./DictionaryItem";

type DictionaryPageViewCardProps = {
    dictionary: TDictionary;
};

export const DictionaryPageViewCard = ({ dictionary }: DictionaryPageViewCardProps) => {
    return (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-2 row-cols-xl-3 g-3">
            {dictionary.map((item) => (
                <DictionaryItem key={item.id} item={item} />
            ))}
        </div>
    );
};
