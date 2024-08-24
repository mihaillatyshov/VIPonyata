import { TLesson } from "models/TLesson";
import { RootState } from "redux/store";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ItemsType = TLesson[] | undefined;
type SelectedType = TLesson | undefined;

export interface LessonsState {
    items: ItemsType;
    selected: SelectedType;
}

const initialState: LessonsState = {
    items: undefined,
    selected: undefined,
};

export const lessonsSlice = createSlice({
    name: "lessons",
    initialState,
    reducers: {
        setLessons: (state, action: PayloadAction<ItemsType>) => {
            state.items = action.payload;
        },
        setSelectedLesson: (state, action: PayloadAction<SelectedType>) => {
            state.selected = action.payload;
        },
    },
});

export const selectLessons = (state: RootState) => state.lessons;

export const { setLessons, setSelectedLesson } = lessonsSlice.actions;

export default lessonsSlice.reducer;
