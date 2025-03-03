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
    BLOCK_BEGIN = "block_begin",
    BLOCK_END = "block_end",
}

export interface TAssessmentItemBase {
    name: TAssessmentTaskName;
}

export interface TAssessmentCheckedItemBase {
    mistakes_count: number;
    cheked: boolean;
}

// * ==================================================================================================================
// * ========== Text ==================================================================================================
// * ==================================================================================================================
interface TAssessmentTextBase extends TAssessmentItemBase {
    name: TAssessmentTaskName.TEXT;
    text: string;
}
export interface TAssessmentText extends TAssessmentTextBase {}
export interface TTeacherAssessmentText extends TAssessmentTextBase {}
export interface TAssessmentCheckedText extends TAssessmentCheckedItemBase {}
export type TAssessmentDoneTryText = TAssessmentText & TTeacherAssessmentText;

// * ==================================================================================================================
// * ========== TestSingle ============================================================================================
// * ==================================================================================================================
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
export interface TAssessmentCheckedTestSingle extends TAssessmentCheckedItemBase {
    mistake_answer: number | null;
}
export type TAssessmentDoneTryTestSingle = TAssessmentTestSingle & TTeacherAssessmentTestSingle;

// * ==================================================================================================================
// * ========== TestMulti =============================================================================================
// * ==================================================================================================================
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
export interface TAssessmentCheckedTestMulti extends TAssessmentCheckedItemBase {
    mistake_answers: number[];
}
export type TAssessmentDoneTryTestMulti = TAssessmentTestMulti & TTeacherAssessmentTestMulti;

// * ==================================================================================================================
// * ========== FindPair ==============================================================================================
// * ==================================================================================================================
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
export interface TAssessmentCheckedFindPair extends TAssessmentCheckedItemBase {
    mistake_lines: number[];
}
export type TAssessmentDoneTryFindPair = TAssessmentFindPair & TTeacherAssessmentFindPair;

// * ==================================================================================================================
// * ========== CreateSentence ========================================================================================
// * ==================================================================================================================
interface TAssessmentCreateSentenceBase extends TAssessmentItemBase {
    name: TAssessmentTaskName.CREATE_SENTENCE;
}
export interface TAssessmentCreateSentence extends TAssessmentCreateSentenceBase {
    parts: string[];
}
export interface TTeacherAssessmentCreateSentence extends TAssessmentCreateSentenceBase {
    meta_parts: string[];
}
export interface TAssessmentCheckedCreateSentence extends TAssessmentCheckedItemBase {
    mistake_parts: number[];
}
export type TAssessmentDoneTryCreateSentence = TAssessmentCreateSentence & TTeacherAssessmentCreateSentence;

// * ==================================================================================================================
// * ========== FillSpacesExists ======================================================================================
// * ==================================================================================================================
export const TAssessmentFillSpacesExistsEmpty = "Пусто";

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
export interface TAssessmentCheckedFillSpacesExists extends TAssessmentCheckedItemBase {
    mistake_answers: number[];
}
export type TAssessmentDoneTryFillSpacesExists = TAssessmentFillSpacesExists & TTeacherAssessmentFillSpacesExists;

// * ==================================================================================================================
// * ========== FillSpacesByHand ======================================================================================
// * ==================================================================================================================
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
export interface TAssessmentCheckedFillSpacesByHand extends TAssessmentCheckedItemBase {
    mistake_answers: number[];
}
export type TAssessmentDoneTryFillSpacesByHand = TAssessmentFillSpacesByHand & TTeacherAssessmentFillSpacesByHand;

// * ==================================================================================================================
// * ========== Classification ========================================================================================
// * ==================================================================================================================
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
export interface TAssessmentCheckedClassification extends TAssessmentCheckedItemBase {
    mistake_answers: number[][];
}
export type TAssessmentDoneTryClassification = TAssessmentClassification & TTeacherAssessmentClassification;

// * ==================================================================================================================
// * ========== SentenceOrder =========================================================================================
// * ==================================================================================================================
interface TAssessmentSentenceOrderBase extends TAssessmentItemBase {
    name: TAssessmentTaskName.SENTENCE_ORDER;
}
export interface TAssessmentSentenceOrder extends TAssessmentSentenceOrderBase {
    parts: string[];
}
export interface TTeacherAssessmentSentenceOrder extends TAssessmentSentenceOrderBase {
    meta_parts: string[];
}
export interface TAssessmentCheckedSentenceOrder extends TAssessmentCheckedItemBase {
    mistake_parts: number[];
}
export type TAssessmentDoneTrySentenceOrder = TAssessmentSentenceOrder & TTeacherAssessmentSentenceOrder;

// * ==================================================================================================================
// * ========== OpenQuestion ==========================================================================================
// * ==================================================================================================================
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
export interface TAssessmentCheckedOpenQuestion extends TAssessmentCheckedItemBase {}
export type TAssessmentDoneTryOpenQuestion = TAssessmentOpenQuestion & TTeacherAssessmentOpenQuestion;

// * ==================================================================================================================
// * ========== Img ===================================================================================================
// * ==================================================================================================================
interface TAssessmentImgBase extends TAssessmentItemBase {
    name: TAssessmentTaskName.IMG;
    description?: string | null;
    url: string;
}
export interface TAssessmentImg extends TAssessmentImgBase {}
export interface TTeacherAssessmentImg extends TAssessmentImgBase {}
export interface TAssessmentCheckedImg extends TAssessmentCheckedItemBase {}
export type TAssessmentDoneTryImg = TAssessmentImg & TTeacherAssessmentImg;

// * ==================================================================================================================
// * ========== Audio =================================================================================================
// * ==================================================================================================================
interface TAssessmentAudioBase extends TAssessmentItemBase {
    name: TAssessmentTaskName.AUDIO;
    description?: string | null;
    url: string;
}
export interface TAssessmentAudio extends TAssessmentAudioBase {}
export interface TTeacherAssessmentAudio extends TAssessmentAudioBase {}
export interface TAssessmentCheckedAudio extends TAssessmentCheckedItemBase {}
export type TAssessmentDoneTryAudio = TAssessmentAudio & TTeacherAssessmentAudio;

// * ==================================================================================================================
// * ========== BlockBegin ============================================================================================
// * ==================================================================================================================
interface TAssessmentBlockBeginBase extends TAssessmentItemBase {
    name: TAssessmentTaskName.BLOCK_BEGIN;
}
export interface TAssessmentBlockBegin extends TAssessmentBlockBeginBase {}
export interface TTeacherAssessmentBlockBegin extends TAssessmentBlockBeginBase {}
export interface TAssessmentCheckedBlockBegin extends TAssessmentCheckedItemBase {}
export type TAssessmentDoneTryBlockBegin = TAssessmentBlockBegin & TTeacherAssessmentBlockBegin;

// * ==================================================================================================================
// * ========== BlockEnd ============================================================================================
// * ==================================================================================================================
interface TAssessmentBlockEndBase extends TAssessmentItemBase {
    name: TAssessmentTaskName.BLOCK_END;
}
export interface TAssessmentBlockEnd extends TAssessmentBlockEndBase {}
export interface TTeacherAssessmentBlockEnd extends TAssessmentBlockEndBase {}
export interface TAssessmentCheckedBlockEnd extends TAssessmentCheckedItemBase {}
export type TAssessmentDoneTryBlockEnd = TAssessmentBlockEnd & TTeacherAssessmentBlockEnd;

// * ==================================================================================================================
// * ========== Combinations ==========================================================================================
// * ==================================================================================================================
export interface TGetAssessmentStudentTypeByName {
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
    [TAssessmentTaskName.BLOCK_BEGIN]: TAssessmentBlockBegin;
    [TAssessmentTaskName.BLOCK_END]: TAssessmentBlockEnd;
}

export interface TGetAsseessmentTeacherTypeByName {
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
    [TAssessmentTaskName.BLOCK_BEGIN]: TTeacherAssessmentBlockBegin;
    [TAssessmentTaskName.BLOCK_END]: TTeacherAssessmentBlockEnd;
}

export interface TGetAsseessmentCheckTypeByName {
    [TAssessmentTaskName.TEXT]: TAssessmentCheckedText;
    [TAssessmentTaskName.TEST_SINGLE]: TAssessmentCheckedTestSingle;
    [TAssessmentTaskName.TEST_MULTI]: TAssessmentCheckedTestMulti;
    [TAssessmentTaskName.FIND_PAIR]: TAssessmentCheckedFindPair;
    [TAssessmentTaskName.CREATE_SENTENCE]: TAssessmentCheckedCreateSentence;
    [TAssessmentTaskName.FILL_SPACES_EXISTS]: TAssessmentCheckedFillSpacesExists;
    [TAssessmentTaskName.FILL_SPACES_BY_HAND]: TAssessmentCheckedFillSpacesByHand;
    [TAssessmentTaskName.CLASSIFICATION]: TAssessmentCheckedClassification;
    [TAssessmentTaskName.SENTENCE_ORDER]: TAssessmentCheckedSentenceOrder;
    [TAssessmentTaskName.OPEN_QUESTION]: TAssessmentCheckedOpenQuestion;
    [TAssessmentTaskName.IMG]: TAssessmentCheckedImg;
    [TAssessmentTaskName.AUDIO]: TAssessmentCheckedAudio;
    [TAssessmentTaskName.BLOCK_BEGIN]: TAssessmentCheckedBlockBegin;
    [TAssessmentTaskName.BLOCK_END]: TAssessmentCheckedBlockEnd;
}

export interface TGetAsseessmentDoneTryTypeByName {
    [TAssessmentTaskName.TEXT]: TAssessmentDoneTryText;
    [TAssessmentTaskName.TEST_SINGLE]: TAssessmentDoneTryTestSingle;
    [TAssessmentTaskName.TEST_MULTI]: TAssessmentDoneTryTestMulti;
    [TAssessmentTaskName.FIND_PAIR]: TAssessmentDoneTryFindPair;
    [TAssessmentTaskName.CREATE_SENTENCE]: TAssessmentDoneTryCreateSentence;
    [TAssessmentTaskName.FILL_SPACES_EXISTS]: TAssessmentDoneTryFillSpacesExists;
    [TAssessmentTaskName.FILL_SPACES_BY_HAND]: TAssessmentDoneTryFillSpacesByHand;
    [TAssessmentTaskName.CLASSIFICATION]: TAssessmentDoneTryClassification;
    [TAssessmentTaskName.SENTENCE_ORDER]: TAssessmentDoneTrySentenceOrder;
    [TAssessmentTaskName.OPEN_QUESTION]: TAssessmentDoneTryOpenQuestion;
    [TAssessmentTaskName.IMG]: TAssessmentDoneTryImg;
    [TAssessmentTaskName.AUDIO]: TAssessmentDoneTryAudio;
    [TAssessmentTaskName.BLOCK_BEGIN]: TAssessmentDoneTryBlockBegin;
    [TAssessmentTaskName.BLOCK_END]: TAssessmentDoneTryBlockEnd;
}

export type TStudentAssessmentAnyItem = TGetAssessmentStudentTypeByName[keyof TGetAssessmentStudentTypeByName];
export type TTeacherAssessmentAnyItem = TGetAsseessmentTeacherTypeByName[keyof TGetAsseessmentTeacherTypeByName];
export type TAssessmentAnyCheckedItem = TGetAsseessmentCheckTypeByName[keyof TGetAsseessmentCheckTypeByName];
export type TAssessmentAnyDoneTryItem = TGetAsseessmentDoneTryTypeByName[keyof TGetAsseessmentDoneTryTypeByName];

export type TStudentAssessmentItems = TStudentAssessmentAnyItem[];
export type TTeacherAssessmentItems = TTeacherAssessmentAnyItem[];
export type TAssessmentCheckedItems = TAssessmentAnyCheckedItem[];

type TTeacherAssessmentTaskDefaultDataAliases = {
    [key in TAssessmentTaskName]: () => TGetAsseessmentTeacherTypeByName[key];
};
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
    block_begin: () => ({ name: TAssessmentTaskName.BLOCK_BEGIN }),
    block_end: () => ({ name: TAssessmentTaskName.BLOCK_END }),
};

export const getTeacherAssessmentTaskDefaultData = (name: TAssessmentTaskName): TTeacherAssessmentAnyItem => {
    return teacherAssessmentTaskDefaultDataAliases[name]();
};

type TAssessmentTaskRusNameAliases = { [key in TAssessmentTaskName]: string };
export const assessmentTaskRusNameAliases: TAssessmentTaskRusNameAliases = {
    text: "Текст",
    test_single: "Тест с одним ответом",
    test_multi: "Тест со множеством ответов",
    find_pair: "Найди пары",
    create_sentence: "Создай предложение",
    fill_spaces_exists: "Заполнить пропуски известными словами",
    fill_spaces_by_hand: "Заполнить пропуски своими словами",
    classification: "Распределить по колонкам",
    sentence_order: "Последовательность предложений",
    open_question: "Открытый вопрос",
    img: "Картинка",
    audio: "Аудио",
    block_begin: "Начало блока",
    block_end: "Конец блока",
};

export const studentAssessmentTaskRusNameAliases: TAssessmentTaskRusNameAliases = {
    text: "Прочитай текст",
    test_single: "Тест с одним ответом",
    test_multi: "Тест со множеством ответов",
    find_pair: "Найди пары",
    create_sentence: "Создай предложение",
    fill_spaces_exists: "Заполни пропуски известными словами",
    fill_spaces_by_hand: "Заполни пропуски своими словами",
    classification: "Распредели по колонкам",
    sentence_order: "Расставь предложения по порядку",
    open_question: "Ответь на вопрос",
    img: "Картинка :3",
    audio: "Прослушай аудио",
    block_begin: "Начало блока",
    block_end: "Конец блока",
};
