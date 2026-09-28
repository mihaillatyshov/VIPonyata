import { createContext, useContext } from "react";

/** Состояние текущего задания лексики (выбранные поля, ошибки и т.п.) и правки карточек слов. */
export interface StudentLexisContextValue {
    selectedItem: any; // TODO: Remove any
    setSelectedItem: (item: any) => void;
    setSelectedItemFields: (fields: any) => void;
    setCardImg: (cardId: number, img: string) => void;
    setCardAssociation: (cardId: number, association: string) => void;
}

export const StudentLexisContext = createContext<StudentLexisContextValue | null>(null);

export const useStudentLexisContext = () => {
    const context = useContext(StudentLexisContext);
    if (context === null) {
        throw new Error("useStudentLexisContext must be used inside StudentLexisPage");
    }
    return context;
};

type SelectedItemAction = { type: "set"; item: any } | { type: "setFields"; fields: any };

export const selectedItemReducer = (state: any, action: SelectedItemAction) => {
    switch (action.type) {
        case "set":
            return action.item;
        case "setFields":
            return { ...state, ...action.fields };
    }
};
