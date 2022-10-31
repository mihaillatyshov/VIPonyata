import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "redux/store";

export interface AssessmentState {
    info: any | undefined;
}

const initialState = {
    info: undefined,
};

export const assessmentSlice = createSlice({
    name: "assessment",
    initialState,
    reducers: {
        setAssessmentInfo: (state, action) => {
            state.info = action.payload;
        },
    },
});

export const selectAssessment = (state: RootState) => state.assessment;

export const { setAssessmentInfo } = assessmentSlice.actions;

export default assessmentSlice.reducer;
