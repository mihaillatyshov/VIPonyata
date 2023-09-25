export interface TDictionaryItemCreate {
    ru: string;
    word_jp: string | null;
    char_jp: string | null;
}

export interface TDictionaryItem {
    id: number;
    char_jp: string | null;
    word_jp: string | null;
    ru: string;
    img: string | null;
}

export type TDictionary = TDictionaryItem[];
