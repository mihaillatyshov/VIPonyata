import { THieroglyph } from "models/Activity/THieroglyph";
import { RootState } from "redux/store";

import { createSlice } from "@reduxjs/toolkit";

import { lexisReducers, LexisState } from "./lexis";

const initialState: LexisState<THieroglyph> = {
    info: undefined,
    items: undefined,
    selectedItem: undefined,
};

export const hieroglyphSlice = createSlice({
    name: "hieroglyph",
    initialState,
    reducers: { ...lexisReducers<THieroglyph>() },
});

export const selectHieroglyph = (state: RootState) => state.hyeroglyph;

export const {
    setLexisInfo,
    setLexisEndByTime,
    setLexisDoneTask,
    setLexisItems,
    setLexisCardImg,
    setLexisCardAssociation,
    setLexisSelectedItem,
    setLexisSelectedItemField,
} = hieroglyphSlice.actions;

export default hieroglyphSlice.reducer;
