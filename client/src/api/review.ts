import { AjaxDelete, AjaxGet, AjaxPatch, AjaxPost } from "libs/ServerAPI";
import { TReviewDictionary, TReviewTopic, TReviewWord } from "models/TReview";

import { queryOptions } from "@tanstack/react-query";

export interface TReviewCatalog {
    dictionaries: TReviewDictionary[];
    topics: TReviewTopic[];
    words: TReviewWord[];
}

export interface TReviewWordFields {
    source: string | null;
    word_jp: string;
    ru: string;
    note: string | null;
    examples: string | null;
}

export type TReviewTrainingResult = "remember" | "partial" | "forgot";

export const reviewKeys = {
    all: ["review"] as const,
    catalog: () => [...reviewKeys.all, "catalog"] as const,
};

export const reviewQueries = {
    catalog: () =>
        queryOptions({
            queryKey: reviewKeys.catalog(),
            queryFn: ({ signal }) => AjaxGet<TReviewCatalog>({ url: "/api/review", signal }),
        }),
};

export const createReviewDictionary = (title: string) =>
    AjaxPost<{ dictionary: TReviewDictionary }>({ url: "/api/review/dictionaries", body: { title } });

export const updateReviewDictionary = (dictionaryId: number, title: string, sort: number) =>
    AjaxPatch({ url: `/api/review/dictionaries/${dictionaryId}`, body: { title, sort } });

export const deleteReviewDictionary = (dictionaryId: number) =>
    AjaxDelete({ url: `/api/review/dictionaries/${dictionaryId}` });

export const createReviewTopic = (dictionaryId: number, title: string) =>
    AjaxPost<{ topic: TReviewTopic }>({ url: "/api/review/topics", body: { dictionary_id: dictionaryId, title } });

export const updateReviewTopic = (topicId: number, title: string, sort: number) =>
    AjaxPatch({ url: `/api/review/topics/${topicId}`, body: { title, sort } });

export const deleteReviewTopic = (topicId: number) => AjaxDelete({ url: `/api/review/topics/${topicId}` });

export const createReviewWord = (topicId: number, word: TReviewWordFields) =>
    AjaxPost({ url: "/api/review/words", body: { topic_id: topicId, ...word } });

export const updateReviewWord = (wordId: number, word: TReviewWordFields) =>
    AjaxPatch({ url: `/api/review/words/${wordId}`, body: word });

export const deleteReviewWord = (wordId: number) => AjaxDelete({ url: `/api/review/words/${wordId}` });

export const saveReviewTrainingResults = (results: Array<{ word_id: number; result: TReviewTrainingResult }>) =>
    AjaxPost<{ words: TReviewWord[] }>({ url: "/api/review/training/session-results", body: { results } });

export const setReviewWordFrozen = (wordId: number, isFrozen: boolean) =>
    AjaxPatch<{ word: TReviewWord }>({
        url: `/api/review/words/${wordId}/memory-state`,
        body: { is_frozen: isFrozen },
    });
