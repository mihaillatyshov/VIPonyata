import { TLexisDoneTasks } from "models/Activity/DoneTasks/TLexisDoneTasks";
import { TLexisItems } from "models/Activity/Items/TLexisItems";
import { TDrilling } from "models/Activity/TDrilling";
import { THieroglyph } from "models/Activity/THieroglyph";

import { PayloadAction } from "@reduxjs/toolkit";

type InfoType<T> = T | undefined | null;
type ItemsType = TLexisItems | undefined;

interface ChangeCardImg {
    cardId: number;
    img: string;
}

interface ChangeCardAssociation {
    cardId: number;
    association: string;
}

export interface LexisState<T> {
    info: InfoType<T>;
    items: ItemsType;
    selectedItem: any;
}

export const lexisReducers = <T extends TDrilling | THieroglyph>() => {
    return {
        setLexisInfo: (state: LexisState<T>, action: PayloadAction<InfoType<T>>) => {
            state.info = action.payload;
        },
        setLexisEndByTime: (state: LexisState<T>) => {
            if (state?.info?.tries) {
                const lastTry = state.info.tries[state.info.tries.length - 1];
                if (lastTry.end_datetime === null) {
                    lastTry.end_datetime = state.info.deadline;
                }
                state.info.deadline = null;
            }
        },
        setLexisDoneTask: (state: LexisState<T>, action: PayloadAction<TLexisDoneTasks>) => {
            if (state?.info?.try) {
                state.info.try.done_tasks = action.payload;
            }
        },
        setLexisItems: (state: LexisState<T>, action: PayloadAction<ItemsType>) => {
            state.items = action.payload;
        },
        setLexisCardImg: (state: LexisState<T>, action: PayloadAction<ChangeCardImg>) => {
            const { cardId, img } = action.payload;
            const card = state.items?.card.find((card) => card.id === cardId);
            if (card !== undefined) card.word.img = img;
        },
        setLexisCardAssociation: (state: LexisState<T>, action: PayloadAction<ChangeCardAssociation>) => {
            const { cardId, association } = action.payload;
            const card = state.items?.card.find((card) => card.id === cardId);
            if (card !== undefined) card.word.association = association;
        },
        setLexisSelectedItem: (state: LexisState<T>, action: PayloadAction<any>) => {
            state.selectedItem = action.payload;
        },
        setLexisSelectedItemField: (state: LexisState<T>, action: PayloadAction<any>) => {
            for (const key in action.payload) state.selectedItem[key] = action.payload[key];
        },
    };
};
