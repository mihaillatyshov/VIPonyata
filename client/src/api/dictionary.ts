import { AjaxGet } from "libs/ServerAPI";
import { TDictionary } from "models/TDictionary";

import { queryOptions } from "@tanstack/react-query";

export const dictionaryKeys = {
    all: ["dictionary"] as const,
    list: () => [...dictionaryKeys.all, "list"] as const,
};

export const dictionaryQueries = {
    list: () =>
        queryOptions({
            queryKey: dictionaryKeys.list(),
            queryFn: ({ signal }) =>
                AjaxGet<{ dictionary: TDictionary }>({ url: "/api/dictionary", signal }).then(
                    (json) => json.dictionary,
                ),
        }),
};
