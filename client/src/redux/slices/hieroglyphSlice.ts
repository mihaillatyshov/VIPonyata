import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "redux/store";

export interface HieroglyphState {
    info: any | undefined;
    items: any | undefined;
    selectedItem: any | undefined;
}

const initialState: HieroglyphState = {
    info: undefined,
    items: undefined,
    selectedItem: undefined,
};

export const hieroglyphSlice = createSlice({
    name: "hieroglyph",
    initialState,
    reducers: {
        setHieroglyphInfo: (state, action) => {
            state.info = action.payload;
        },
        setHieroglyphEndByTime: (state) => {
            state.info.tries[state.info.tries.length - 1].end_datetime = state.info.deadline;
            state.info.deadline = undefined;
        },
        setHieroglyphDoneTask: (state, action) => {
            state.info.try.done_tasks = action.payload;
        },
        setHieroglyphItems: (state, action) => {
            state.items = action.payload;
        },
        setHieroglyphSelectedItem: (state, action) => {
            state.selectedItem = action.payload;
        },
        setHieroglyphSelectedItemField: (state, action) => {
            for (const key in action.payload) state.selectedItem[key] = action.payload[key];
        },
    },
});

export const selectHieroglyph = (state: RootState) => state.hyeroglyph;

export const {
    setHieroglyphInfo,
    setHieroglyphEndByTime,
    setHieroglyphDoneTask,
    setHieroglyphItems,
    setHieroglyphSelectedItem,
    setHieroglyphSelectedItemField,
} = hieroglyphSlice.actions;

export default hieroglyphSlice.reducer;
