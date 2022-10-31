import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "redux/store";

export interface LessonsState {
    items: any[] | undefined;
    selected: any | undefined;
}

const initialState: LessonsState = {
    items: undefined,
    selected: undefined,
};

export const lessonsSlice = createSlice({
    name: "lessons",
    initialState,
    reducers: {
        setLessons: (state, action) => {
            state.items = action.payload;
        },
        setSelectedLesson: (state, action) => {
            state.selected = action.payload;
        },
    },
});

export const selectLessons = (state: RootState) => state.lessons;

export const { setLessons, setSelectedLesson } = lessonsSlice.actions;

export default lessonsSlice.reducer;
