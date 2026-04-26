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
    topic_id: number;
    created_at: string;
}
