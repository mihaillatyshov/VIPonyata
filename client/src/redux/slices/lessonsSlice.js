import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    items: undefined,
    selected: undefined,
};

export const lessonsSlice = createSlice({
    name: "lessons",
    initialState: initialState,
    reducers: {
        setLessons: (state, action) => {
            state.items = action.payload;
        },
        setSelectedLesson: (state, action) => {
            state.selected = action.payload;
        },
    },
});

export const { setLessons, setSelectedLesson } = lessonsSlice.actions;

export default lessonsSlice.reducer;
