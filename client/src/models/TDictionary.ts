export interface TDictionaryItem {
    id: number;
    char_jp: string;
    word_jp: string;
    ru: string;
    img: string;
}

export type TDictionary = TDictionaryItem[];
