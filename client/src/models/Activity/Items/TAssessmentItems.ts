export interface TAssessmentItemBase {
    name:
        | "text"
        | "test_single"
        | "test_multi"
        | "find_pair"
        | "create_sentence"
        | "fill_spaces_exists"
        | "fill_spaces_by_hand"
        | "classification"
        | "sentence_order"
        | "open_question"
        | "img";
}

export interface TAssessmentText extends TAssessmentItemBase {
    text: string;
}

export interface TAssessmentTestSingle extends TAssessmentItemBase {
    answer: number | null;
    options: string[];
    question: string;
}

export interface TAssessmentTestMulti extends TAssessmentItemBase {
    answers: number[];
    options: string[];
    question: string;
}

export interface TAssessmentFindPair extends TAssessmentItemBase {
    first: string[];
    second: string[];
}

export interface TAssessmentCreateSentence extends TAssessmentItemBase {
    parts: string[];
}

export interface TAssessmentFillSpacesExists extends TAssessmentItemBase {
    parts: string[];
    answers: (string | null)[];
    inputs: string[];
    separates: string[];
}

export interface TAssessmentFillSpacesByHand extends TAssessmentItemBase {
    answers: string[];
    separates: string[];
}

export interface TAssessmentClassification extends TAssessmentItemBase {
    inputs: string[];
    titles: string[];
    answers: string[][];
}

export interface TAssessmentSentenceOrder extends TAssessmentItemBase {
    sentences: string[];
}

export interface TAssessmentOpenQuestion extends TAssessmentItemBase {
    answer: string;
    question: string;
}

export interface TAssessmentImg extends TAssessmentItemBase {
    url: string;
}

export type TAssessmentAnyItem =
    | TAssessmentText
    | TAssessmentTestSingle
    | TAssessmentTestMulti
    | TAssessmentFindPair
    | TAssessmentCreateSentence
    | TAssessmentFillSpacesExists
    | TAssessmentFillSpacesByHand
    | TAssessmentClassification
    | TAssessmentSentenceOrder
    | TAssessmentOpenQuestion
    | TAssessmentImg;

export type TAssessmentItems = TAssessmentAnyItem[];
