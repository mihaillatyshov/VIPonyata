import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { TLexisDoneTasks } from "models/Activity/DoneTasks/TLexisDoneTasks";
import { TLexisItems } from "models/Activity/Items/TLexisItems";
import { TDrilling } from "models/Activity/TDrilling";
import { RootState } from "redux/store";

type InfoType = TDrilling | undefined;
type ItemsType = TLexisItems | undefined;

export interface DrillingState {
    info: InfoType;
    items: ItemsType;
    selectedItem: any | undefined;
}

const initialState: DrillingState = {
    info: undefined,
    items: undefined,
    selectedItem: undefined,
};

export const drillingSlice = createSlice({
    name: "drilling",
    initialState,
    reducers: {
        setDrillingInfo: (state, action: PayloadAction<InfoType>) => {
            state.info = action.payload;
        },
        setDrillingEndByTime: (state) => {
            if (state.info && state.info.tries) {
                let lastTry = state.info.tries[state.info.tries.length - 1];
                if (lastTry.end_datetime) {
                    lastTry.end_datetime = state.info.deadline;
                }
                state.info.deadline = null;
            }
        },
        setDrillingDoneTask: (state, action: PayloadAction<TLexisDoneTasks>) => {
            if (state.info && state.info.try) {
                state.info.try.done_tasks = action.payload;
            }
        },
        setDrillingItems: (state, action: PayloadAction<ItemsType>) => {
            state.items = action.payload;
        },
        setDrillingSelectedItem: (state, action) => {
            state.selectedItem = action.payload;
        },
        setDrillingSelectedItemField: (state, action) => {
            for (const key in action.payload) state.selectedItem[key] = action.payload[key];
        },
    },
});

export const selectDrilling = (state: RootState) => state.drilling;

export const {
    setDrillingInfo,
    setDrillingEndByTime,
    setDrillingDoneTask,
    setDrillingItems,
    setDrillingSelectedItem,
    setDrillingSelectedItemField,
} = drillingSlice.actions;

export default drillingSlice.reducer;
