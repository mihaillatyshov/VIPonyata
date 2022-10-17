import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    items: undefined,
    selected: undefined,
};

export const coursesSlice = createSlice({
    name: "courses",
    initialState: initialState,
    reducers: {
        setCourses: (state, action) => {
            state.items = action.payload;
        },
        setSelectedCourse: (state, action) => {
            state.selected = action.payload;
        },
    },
});

export const { setCourses, setSelectedCourse } = coursesSlice.actions;

export default coursesSlice.reducer;
