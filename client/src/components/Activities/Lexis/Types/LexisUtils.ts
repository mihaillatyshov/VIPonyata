import { LexisName, LexisNameDrilling, LexisNameHieroglyph } from "models/Activity/IActivity";

import { useStudentLexisContext } from "../StudentLexisContext";

export const pickLexisDrilOrHier = <D, H>(name: LexisName, dril: D, hier: H) => {
    switch (name) {
        case LexisNameDrilling:
            return dril;
        case LexisNameHieroglyph:
            return hier;
    }
};

export const pickLexisWordOrChar = (name: LexisName): "word_jp" | "char_jp" => {
    return pickLexisDrilOrHier(name, "word_jp", "char_jp");
};

export const pickLexisWordsOrChars = (name: LexisName): "words_jp" | "chars_jp" => {
    return pickLexisDrilOrHier(name, "words_jp", "chars_jp");
};

export const pickScrambeWordOrChar = (name: LexisName): ["word_words", "word_chars"] | ["char_words", "char_chars"] => {
    return pickLexisDrilOrHier(name, ["word_words", "word_chars"], ["char_words", "char_chars"]);
};

export const useLexisItem = <T>(): T => {
    return useStudentLexisContext().selectedItem;
};

export const useSetLexisCardExtras = () => {
    const { setCardImg, setCardAssociation } = useStudentLexisContext();

    return {
        setCardImg: (img: string, id: number) => setCardImg(id, img),
        setCardAssociation: (association: string, id: number) => setCardAssociation(id, association),
    };
};

export const useSetLexisSelectedItem = () => {
    return useStudentLexisContext().setSelectedItem;
};

export const useSetLexisSelectedItemField = <T>(): ((data: Partial<T>) => void) => {
    return useStudentLexisContext().setSelectedItemFields;
};

export type GoToNextTaskCallbackType = (taskTypeName: string, percent: number) => void;

export type StudentLexisTaskProps<T> = {
    name: LexisName;
    inData: T;
    goToNextTaskCallback: GoToNextTaskCallbackType;
};
