import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    info: undefined,
};

export const assessmentSlice = createSlice({
    name: "assessment",
    initialState: initialState,
    reducers: {
        setAssessmentInfo: (state, action) => {
            state.info = action.payload;
        },
    },
});

export const { setAssessmentInfo } = assessmentSlice.actions;

export default assessmentSlice.reducer;
