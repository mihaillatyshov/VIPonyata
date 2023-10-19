import { TDrilling } from "models/Activity/TDrilling";
import { RootState } from "redux/store";

import { createSlice } from "@reduxjs/toolkit";

import { lexisReducers, LexisState } from "./lexis";

const initialState: LexisState<TDrilling> = {
    info: undefined,
    items: undefined,
    selectedItem: undefined,
};

export const drillingSlice = createSlice({
    name: "drilling",
    initialState,
    reducers: { ...lexisReducers<TDrilling>() },
});

export const selectDrilling = (state: RootState) => state.drilling;

export const {
    setLexisInfo,
    setLexisEndByTime,
    setLexisDoneTask,
    setLexisItems,
    setLexisCardImg,
    setLexisCardAssociation,
    setLexisSelectedItem,
    setLexisSelectedItemField,
} = drillingSlice.actions;

export default drillingSlice.reducer;
