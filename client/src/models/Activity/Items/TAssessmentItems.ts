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
    AUDIO = "audio",
}

export interface TAssessmentItemBase {
    name: TAssessmentTaskName;
}

// * ==========================================================================
// * ========== Text ==========================================================
// * ==========================================================================
interface TAssessmentTextBase extends TAssessmentItemBase {
    name: TAssessmentTaskName.TEXT;
    text: string;
}
export interface TAssessmentText extends TAssessmentTextBase {}
export interface TTeacherAssessmentText extends TAssessmentTextBase {}

// * ==========================================================================
// * ========== TestSingle ====================================================
// * ==========================================================================
interface TAssessmentTestSingleBase extends TAssessmentItemBase {
    name: TAssessmentTaskName.TEST_SINGLE;
    options: string[];
    question: string;
}
export interface TAssessmentTestSingle extends TAssessmentTestSingleBase {
    answer: number | null;
}
export interface TTeacherAssessmentTestSingle extends TAssessmentTestSingleBase {
    meta_answer: number | null;
}

// * ==========================================================================
// * ========== TestMulti =====================================================
// * ==========================================================================
interface TAssessmentTestMultiBase extends TAssessmentItemBase {
    name: TAssessmentTaskName.TEST_MULTI;
    options: string[];
    question: string;
}
export interface TAssessmentTestMulti extends TAssessmentTestMultiBase {
    answers: number[];
}
export interface TTeacherAssessmentTestMulti extends TAssessmentTestMultiBase {
    meta_answers: number[];
}

// * ==========================================================================
// * ========== FindPair ======================================================
// * ==========================================================================
interface TAssessmentFindPairBase extends TAssessmentItemBase {
    name: TAssessmentTaskName.FIND_PAIR;
}
export interface TAssessmentFindPair extends TAssessmentFindPairBase {
    first: string[];
    second: string[];
    pars_created: number;
}
export interface TTeacherAssessmentFindPair extends TAssessmentFindPairBase {
    meta_first: string[];
    meta_second: string[];
}

// * ==========================================================================
// * ========== CreateSentence ================================================
// * ==========================================================================
interface TAssessmentCreateSentenceBase extends TAssessmentItemBase {
    name: TAssessmentTaskName.CREATE_SENTENCE;
}
export interface TAssessmentCreateSentence extends TAssessmentCreateSentenceBase {
    parts: string[];
}
export interface TTeacherAssessmentCreateSentence extends TAssessmentCreateSentenceBase {
    meta_parts: string[];
}

// * ==========================================================================
// * ========== FillSpacesExists ==============================================
// * ==========================================================================
interface TAssessmentFillSpacesExistsBase extends TAssessmentItemBase {
    name: TAssessmentTaskName.FILL_SPACES_EXISTS;
    separates: string[];
}
export interface TAssessmentFillSpacesExists extends TAssessmentFillSpacesExistsBase {
    answers: (string | null)[];
    inputs: string[];
}
export interface TTeacherAssessmentFillSpacesExists extends TAssessmentFillSpacesExistsBase {
    meta_answers: string[];
}

// * ==========================================================================
// * ========== FillSpacesByHand ==============================================
// * ==========================================================================
interface TAssessmentFillSpacesByHandBase extends TAssessmentItemBase {
    name: TAssessmentTaskName.FILL_SPACES_BY_HAND;
    separates: string[];
}
export interface TAssessmentFillSpacesByHand extends TAssessmentFillSpacesByHandBase {
    answers: string[];
}
export interface TTeacherAssessmentFillSpacesByHand extends TAssessmentFillSpacesByHandBase {
    meta_answers: string[];
}

// * ==========================================================================
// * ========== Classification ================================================
// * ==========================================================================
interface TAssessmentClassificationBase extends TAssessmentItemBase {
    name: TAssessmentTaskName.CLASSIFICATION;
    inputs: string[];
    titles: string[];
}
export interface TAssessmentClassification extends TAssessmentClassificationBase {
    answers: string[][];
}
export interface TTeacherAssessmentClassification extends TAssessmentClassificationBase {
    meta_answers: string[][];
}

// * ==========================================================================
// * ========== SentenceOrder =================================================
// * ==========================================================================
interface TAssessmentSentenceOrderBase extends TAssessmentItemBase {
    name: TAssessmentTaskName.SENTENCE_ORDER;
}
export interface TAssessmentSentenceOrder extends TAssessmentSentenceOrderBase {
    parts: string[];
}
export interface TTeacherAssessmentSentenceOrder extends TAssessmentSentenceOrderBase {
    meta_parts: string[];
}

// * ==========================================================================
// * ========== OpenQuestion ==================================================
// * ==========================================================================
interface TAssessmentOpenQuestionBase extends TAssessmentItemBase {
    name: TAssessmentTaskName.OPEN_QUESTION;
    question: string;
}
export interface TAssessmentOpenQuestion extends TAssessmentOpenQuestionBase {
    answer: string;
}
export interface TTeacherAssessmentOpenQuestion extends TAssessmentOpenQuestionBase {
    meta_answer: string;
}

// * ==========================================================================
// * ========== Img ===========================================================
// * ==========================================================================
interface TAssessmentImgBase extends TAssessmentItemBase {
    name: TAssessmentTaskName.IMG;
    url: string;
}
export interface TAssessmentImg extends TAssessmentImgBase {}
export interface TTeacherAssessmentImg extends TAssessmentImgBase {}

// * ==========================================================================
// * ========== Audio =========================================================
// * ==========================================================================
interface TAssessmentAudioBase extends TAssessmentItemBase {
    name: TAssessmentTaskName.AUDIO;
    url: string;
}
export interface TAssessmentAudio extends TAssessmentAudioBase {}
export interface TTeacherAssessmentAudio extends TAssessmentAudioBase {}

export interface TGetStudentTypeByName {
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
    [TAssessmentTaskName.AUDIO]: TAssessmentAudio;
}

export interface TGetTeacherTypeByName {
    [TAssessmentTaskName.TEXT]: TTeacherAssessmentText;
    [TAssessmentTaskName.TEST_SINGLE]: TTeacherAssessmentTestSingle;
    [TAssessmentTaskName.TEST_MULTI]: TTeacherAssessmentTestMulti;
    [TAssessmentTaskName.FIND_PAIR]: TTeacherAssessmentFindPair;
    [TAssessmentTaskName.CREATE_SENTENCE]: TTeacherAssessmentCreateSentence;
    [TAssessmentTaskName.FILL_SPACES_EXISTS]: TTeacherAssessmentFillSpacesExists;
    [TAssessmentTaskName.FILL_SPACES_BY_HAND]: TTeacherAssessmentFillSpacesByHand;
    [TAssessmentTaskName.CLASSIFICATION]: TTeacherAssessmentClassification;
    [TAssessmentTaskName.SENTENCE_ORDER]: TTeacherAssessmentSentenceOrder;
    [TAssessmentTaskName.OPEN_QUESTION]: TTeacherAssessmentOpenQuestion;
    [TAssessmentTaskName.IMG]: TTeacherAssessmentImg;
    [TAssessmentTaskName.AUDIO]: TTeacherAssessmentAudio;
}

export type TAssessmentAnyItem = TGetStudentTypeByName[keyof TGetStudentTypeByName];
export type TTeacherAssessmentAnyItem = TGetTeacherTypeByName[keyof TGetTeacherTypeByName];

export type TAssessmentItems = TAssessmentAnyItem[];
export type TTeacherAssessmentItems = TTeacherAssessmentAnyItem[];

type TTeacherAssessmentTaskDefaultDataAliases = { [key in TAssessmentTaskName]: () => TGetTeacherTypeByName[key] };
const teacherAssessmentTaskDefaultDataAliases: TTeacherAssessmentTaskDefaultDataAliases = {
    text: () => ({ name: TAssessmentTaskName.TEXT, text: "" }),
    test_single: () => ({ name: TAssessmentTaskName.TEST_SINGLE, meta_answer: null, options: [], question: "" }),
    test_multi: () => ({ name: TAssessmentTaskName.TEST_MULTI, meta_answers: [], options: [], question: "" }),
    find_pair: () => ({ name: TAssessmentTaskName.FIND_PAIR, meta_first: [], meta_second: [] }),
    create_sentence: () => ({ name: TAssessmentTaskName.CREATE_SENTENCE, meta_parts: [] }),
    fill_spaces_exists: () => ({
        name: TAssessmentTaskName.FILL_SPACES_EXISTS,
        meta_answers: [],
        inputs: [],
        separates: [""],
    }),
    fill_spaces_by_hand: () => ({ name: TAssessmentTaskName.FILL_SPACES_BY_HAND, meta_answers: [], separates: [""] }),
    classification: () => ({
        name: TAssessmentTaskName.CLASSIFICATION,
        inputs: [],
        titles: [],
        meta_answers: [],
    }),
    sentence_order: () => ({ name: TAssessmentTaskName.SENTENCE_ORDER, meta_parts: [] }),
    open_question: () => ({ name: TAssessmentTaskName.OPEN_QUESTION, meta_answer: "", question: "" }),
    img: () => ({ name: TAssessmentTaskName.IMG, url: "" }),
    audio: () => ({ name: TAssessmentTaskName.AUDIO, url: "" }),
};

export const getTeacherAssessmentTaskDefaultData = (name: TAssessmentTaskName): TTeacherAssessmentAnyItem => {
    return teacherAssessmentTaskDefaultDataAliases[name]();
};

type TAssessmentTaskRusNameAliases = { [key in TAssessmentTaskName]: string };
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
    audio: "Аудио",
};
