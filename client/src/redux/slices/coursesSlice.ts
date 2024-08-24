import { TCourse } from "models/TCourse";
import { RootState } from "redux/store";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ItemsType = TCourse[] | undefined;
type SelectedType = TCourse | undefined;

export interface CoursesState {
    items: ItemsType;
    selected: SelectedType;
}

const initialState: CoursesState = {
    items: undefined,
    selected: undefined,
};

export const coursesSlice = createSlice({
    name: "courses",
    initialState,
    reducers: {
        setCourses: (state, action: PayloadAction<ItemsType>) => {
            state.items = action.payload;
        },
        setSelectedCourse: (state, action: PayloadAction<SelectedType>) => {
            state.selected = action.payload;
        },
    },
});

export const selectCourses = (state: RootState) => state.courses;

export const { setCourses, setSelectedCourse } = coursesSlice.actions;

export default coursesSlice.reducer;
