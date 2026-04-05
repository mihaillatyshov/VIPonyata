import { TLesson, TUnfinishedLessonsSummary } from "models/TLesson";
import { RootState } from "redux/store";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ItemsType = TLesson[] | undefined;
type SelectedType = TLesson | undefined;
type UnfinishedLessonsSummaryType = TUnfinishedLessonsSummary | undefined;

export interface LessonsState {
    items: ItemsType;
    selected: SelectedType;
    unfinishedLessonsSummary: UnfinishedLessonsSummaryType;
}

const initialState: LessonsState = {
    items: undefined,
    selected: undefined,
    unfinishedLessonsSummary: undefined,
};

export const lessonsSlice = createSlice({
    name: "lessons",
    initialState,
    reducers: {
        setLessons: (state, action: PayloadAction<ItemsType>) => {
            state.items = action.payload;
            if (action.payload === undefined) {
                state.unfinishedLessonsSummary = undefined;
            }
        },
        setSelectedLesson: (state, action: PayloadAction<SelectedType>) => {
            state.selected = action.payload;
        },
        setUnfinishedLessonsSummary: (state, action: PayloadAction<UnfinishedLessonsSummaryType>) => {
            state.unfinishedLessonsSummary = action.payload;
        },
    },
});

export const selectLessons = (state: RootState) => state.lessons;

export const { setLessons, setSelectedLesson, setUnfinishedLessonsSummary } = lessonsSlice.actions;

export default lessonsSlice.reducer;
