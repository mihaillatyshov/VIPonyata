import { LexisName, LexisNameDrilling, LexisNameHieroglyph } from "models/Activity/IActivity";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import {
    selectDrilling,
    setLexisCardAssociation as setDrillingCardAssociation,
    setLexisCardImg as setDrillingCardImg,
    setLexisSelectedItem as setDrillingSelectedItem,
    setLexisSelectedItemField as setDrillingSelectedItemField,
} from "redux/slices/drillingSlice";
import {
    selectHieroglyph,
    setLexisCardAssociation as setHieroglyphCardAssociation,
    setLexisCardImg as setHieroglyphCardImg,
    setLexisSelectedItem as setHieroglyphSelectedItem,
    setLexisSelectedItemField as setHieroglyphSelectedItemField,
} from "redux/slices/hieroglyphSlice";

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

export const useLexisItem = <T>(name: LexisName): T => {
    const drilling = useAppSelector(selectDrilling).selectedItem;
    const hieroglyph = useAppSelector(selectHieroglyph).selectedItem;

    return pickLexisDrilOrHier(name, drilling, hieroglyph);
};

export const useSetLexisCardExtras = (name: LexisName) => {
    const dispatch = useAppDispatch();

    return pickLexisDrilOrHier(
        name,
        {
            setCardImg: (img: string, id: number) => {
                dispatch(setDrillingCardImg({ img, cardId: id }));
            },
            setCardAssociation: (association: string, id: number) => {
                dispatch(setDrillingCardAssociation({ association, cardId: id }));
            },
        },
        {
            setCardImg: (img: string, id: number) => {
                dispatch(setHieroglyphCardImg({ img, cardId: id }));
            },
            setCardAssociation: (association: string, id: number) => {
                dispatch(setHieroglyphCardAssociation({ association, cardId: id }));
            },
        },
    );
};

export const useSetLexisSelectedItem = (name: LexisName) => {
    const dispatch = useAppDispatch();

    return pickLexisDrilOrHier(
        name,
        (data: any) => {
            dispatch(setDrillingSelectedItem(data));
        },
        (data: any) => {
            dispatch(setHieroglyphSelectedItem(data));
        },
    );
};

export const useSetLexisSelectedItemField = <T>(name: LexisName) => {
    const dispatch = useAppDispatch();

    return pickLexisDrilOrHier(
        name,
        (data: Partial<T>) => {
            dispatch(setDrillingSelectedItemField(data));
        },
        (data: Partial<T>) => {
            dispatch(setHieroglyphSelectedItemField(data));
        },
    );
};

export type GoToNextTaskCallbackType = (taskTypeName: string, percent: number) => void;

export type StudentLexisTaskProps<T> = {
    name: LexisName;
    inData: T;
    goToNextTaskCallback: GoToNextTaskCallbackType;
};
