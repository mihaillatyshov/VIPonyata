export type TReviewWordStatus = "shaky" | "passive" | "active";

export interface TReviewDictionary {
    id: number;
    title: string;
    sort: number;
    owner_id: number;
    created_at: string;
}

export interface TReviewTopic {
    id: number;
    title: string;
    sort: number;
    dictionary_id: number;
    created_at: string;
}

export interface TReviewWord {
    id: number;
    source: string | null;
    word_jp: string;
    ru: string;
    note: string | null;
    examples: string | null;
    status: TReviewWordStatus;
    stage: 1 | 2 | 3;
    is_frozen: boolean;
    topic_id: number;
    created_at: string;
}
