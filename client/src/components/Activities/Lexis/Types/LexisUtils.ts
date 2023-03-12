import { useAppDispatch, useAppSelector } from "redux/hooks";

import { selectDrilling, setDrillingSelectedItem, setDrillingSelectedItemField } from "redux/slices/drillingSlice";
import {
    selectHieroglyph,
    setHieroglyphSelectedItem,
    setHieroglyphSelectedItemField,
} from "redux/slices/hieroglyphSlice";

export type LexisName = "drilling" | "hieroglyph";

export const NameTo_dril_or_hier = (name: LexisName, dril: any, hier: any) => {
    switch (name) {
        case "drilling":
            return dril;
        case "hieroglyph":
            return hier;
    }
};

export const NameTo_word_or_char = (name: LexisName): "word_jp" | "char_jp" => {
    return NameTo_dril_or_hier(name, "word_jp", "char_jp");
};

export const NameTo_words_or_chars = (name: LexisName): "words_jp" | "chars_jp" => {
    return NameTo_dril_or_hier(name, "words_jp", "chars_jp");
};

export const NameToScrambe_word_or_char = (
    name: LexisName
): ["word_words", "word_chars"] | ["char_words", "char_chars"] => {
    return NameTo_dril_or_hier(name, ["word_words", "word_chars"], ["char_words", "char_chars"]);
};

export const useLexisItem = (name: LexisName) => {
    const drilling = useAppSelector(selectDrilling).selectedItem;
    const hieroglyph = useAppSelector(selectHieroglyph).selectedItem;

    return NameTo_dril_or_hier(name, drilling, hieroglyph);
};

export const useSetLexisSelectedItem = (name: LexisName) => {
    const dispatch = useAppDispatch();

    return NameTo_dril_or_hier(
        name,
        (data: any) => {
            dispatch(setDrillingSelectedItem(data));
        },
        (data: any) => {
            dispatch(setHieroglyphSelectedItem(data));
        }
    );
};

export const useSetLexisSelectedItemField = (name: LexisName) => {
    const dispatch = useAppDispatch();

    return NameTo_dril_or_hier(
        name,
        (data: any) => {
            dispatch(setDrillingSelectedItemField(data));
        },
        (data: any) => {
            dispatch(setHieroglyphSelectedItemField(data));
        }
    );
};

export type GoToNextTaskCallbackType = (taskTypeName: string, percent: number) => void;

export type StudentLexisTaskProps<T> = {
    name: LexisName;
    inData: T;
    goToNextTaskCallback: GoToNextTaskCallbackType;
};
