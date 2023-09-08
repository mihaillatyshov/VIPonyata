export enum TAssessmentTaskName {
    TEXT = "text",
    TEST_SINGLE = "test_single",
    TEST_MULTI = "test_multi",
    FIND_PAIR = "find_pair",
    CREATE_SENTENCE = "create_sentence",
    FILL_SPACES_EXISTS = "fill_spaces_exists",
    FILL_SPACES_BY_HAND = "fill_spaces_by_hand",
    CLASSIFICATION = "classification",
    SENTENCE_ORDER = "sentence_order",
    OPEN_QUESTION = "open_question",
    IMG = "img",
}

export interface TAssessmentItemBase {
    name: TAssessmentTaskName;
}

export interface TAssessmentText extends TAssessmentItemBase {
    name: TAssessmentTaskName.TEXT;
    text: string;
}

export interface TAssessmentTestSingle extends TAssessmentItemBase {
    name: TAssessmentTaskName.TEST_SINGLE;
    answer: number | null;
    options: string[];
    question: string;
}

export interface TAssessmentTestMulti extends TAssessmentItemBase {
    name: TAssessmentTaskName.TEST_MULTI;
    answers: number[];
    options: string[];
    question: string;
}

export interface TAssessmentFindPair extends TAssessmentItemBase {
    name: TAssessmentTaskName.FIND_PAIR;
    first: string[];
    second: string[];
    pars_created: number;
}

export interface TAssessmentCreateSentence extends TAssessmentItemBase {
    name: TAssessmentTaskName.CREATE_SENTENCE;
    parts: string[];
}

export interface TAssessmentFillSpacesExists extends TAssessmentItemBase {
    name: TAssessmentTaskName.FILL_SPACES_EXISTS;
    parts: string[];
    answers: (string | null)[];
    inputs: string[];
    separates: string[];
}

export interface TAssessmentFillSpacesByHand extends TAssessmentItemBase {
    name: TAssessmentTaskName.FILL_SPACES_BY_HAND;
    answers: string[];
    separates: string[];
}

export interface TAssessmentClassification extends TAssessmentItemBase {
    name: TAssessmentTaskName.CLASSIFICATION;
    inputs: string[];
    titles: string[];
    answers: string[][];
}

export interface TAssessmentSentenceOrder extends TAssessmentItemBase {
    name: TAssessmentTaskName.SENTENCE_ORDER;
    parts: string[];
}

export interface TAssessmentOpenQuestion extends TAssessmentItemBase {
    name: TAssessmentTaskName.OPEN_QUESTION;
    answer: string;
    question: string;
}

export interface TAssessmentImg extends TAssessmentItemBase {
    name: TAssessmentTaskName.IMG;
    url: string;
}

export interface GetTypeByName {
    [TAssessmentTaskName.TEXT]: TAssessmentText;
    [TAssessmentTaskName.TEST_SINGLE]: TAssessmentTestSingle;
    [TAssessmentTaskName.TEST_MULTI]: TAssessmentTestMulti;
    [TAssessmentTaskName.FIND_PAIR]: TAssessmentFindPair;
    [TAssessmentTaskName.CREATE_SENTENCE]: TAssessmentCreateSentence;
    [TAssessmentTaskName.FILL_SPACES_EXISTS]: TAssessmentFillSpacesExists;
    [TAssessmentTaskName.FILL_SPACES_BY_HAND]: TAssessmentFillSpacesByHand;
    [TAssessmentTaskName.CLASSIFICATION]: TAssessmentClassification;
    [TAssessmentTaskName.SENTENCE_ORDER]: TAssessmentSentenceOrder;
    [TAssessmentTaskName.OPEN_QUESTION]: TAssessmentOpenQuestion;
    [TAssessmentTaskName.IMG]: TAssessmentImg;
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

type TAssessmentTaskDefaultDataAliases = {
    [key in TAssessmentTaskName]: () => GetTypeByName[key];
};

const assessmentTaskDefaultDataAliases: TAssessmentTaskDefaultDataAliases = {
    text: () => ({ name: TAssessmentTaskName.TEXT, text: "" }),
    test_single: () => ({ name: TAssessmentTaskName.TEST_SINGLE, answer: null, options: [], question: "" }),
    test_multi: () => ({ name: TAssessmentTaskName.TEST_MULTI, answers: [], options: [], question: "" }),
    find_pair: () => ({ name: TAssessmentTaskName.FIND_PAIR, first: [], second: [], pars_created: 0 }),
    create_sentence: () => ({ name: TAssessmentTaskName.CREATE_SENTENCE, parts: [] }),
    fill_spaces_exists: () => ({
        name: TAssessmentTaskName.FILL_SPACES_EXISTS,
        parts: [],
        answers: [],
        inputs: [],
        separates: ["dsa"],
    }),
    fill_spaces_by_hand: () => ({ name: TAssessmentTaskName.FILL_SPACES_BY_HAND, answers: [], separates: [""] }),
    classification: () => ({ name: TAssessmentTaskName.CLASSIFICATION, inputs: [], titles: [], answers: [] }),
    sentence_order: () => ({ name: TAssessmentTaskName.SENTENCE_ORDER, parts: [] }),
    open_question: () => ({ name: TAssessmentTaskName.OPEN_QUESTION, answer: "", question: "" }),
    img: () => ({ name: TAssessmentTaskName.IMG, url: "" }),
};

export const getAssessmentTaskDefaultData = (name: TAssessmentTaskName): TAssessmentAnyItem => {
    return assessmentTaskDefaultDataAliases[name]();
};

type TAssessmentTaskRusNameAliases = {
    [key in TAssessmentTaskName]: string;
};

export const assessmentTaskRusNameAliases: TAssessmentTaskRusNameAliases = {
    text: "Текст",
    test_single: "Тест с одним ответом",
    test_multi: "Тест с множеством ответов",
    find_pair: "Найди  пару",
    create_sentence: "Создай предложение",
    fill_spaces_exists: "Заполнить пропуски известными словами",
    fill_spaces_by_hand: "Заполнить пропуски своими словами",
    classification: "Распределить по колонкам",
    sentence_order: "Последовательность предложений",
    open_question: "Открытый вопрос",
    img: "Картинка",
};
