import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "redux/store";

export interface CoursesState {
    items: any[] | undefined;
    selected: any | undefined;
}

const initialState: CoursesState = {
    items: undefined,
    selected: undefined,
};

export const coursesSlice = createSlice({
    name: "courses",
    initialState,
    reducers: {
        setCourses: (state, action) => {
            state.items = action.payload;
        },
        setSelectedCourse: (state, action) => {
            state.selected = action.payload;
        },
    },
});

export const selectCourses = (state: RootState) => state.courses;

export const { setCourses, setSelectedCourse } = coursesSlice.actions;

export default coursesSlice.reducer;
