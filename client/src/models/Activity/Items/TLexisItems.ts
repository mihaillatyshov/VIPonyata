export interface TCreateCardItem {
    sentence: string;
    answer: string;
    dictionary_id: number;
}

interface CardWord {
    ru: string;
    word_jp: string;
    char_jp: string;
    img: string | null;
    association: string | null;
}

export interface TSingleCardItem {
    id: number;
    sentence: string;
    answer: string;
    base_id: number;
    dictionary_id: number;
    word: CardWord;
}

export type TCardItem = TSingleCardItem[];

export interface TFindPair {
    answers: { chars_jp: number[]; words_jp: number[]; words_ru: number[] };
    chars_jp: string[];
    words_jp: string[];
    words_ru: string[];
}

export interface TScramble {
    char_chars: string[];
    char_words: string[];
    word_chars: string[];
    word_words: string[];
}

export interface TSpace {
    words: {
        spaces: number;
        word_end: string;
        word_or_char_jp: string;
        word_ru: string;
        word_start: string;
    }[];
}

export interface TTranslate {
    chars_jp: string[];
    words_jp: string[];
    words_ru: string[];
}

export interface TLexisItems {
    card: TCardItem;
    findpair?: TFindPair;
    scramble?: TScramble;
    space?: TSpace;
    translate?: TTranslate;
}

export type TLexisAnyItem = TCardItem | TFindPair | TScramble | TSpace | TTranslate;
