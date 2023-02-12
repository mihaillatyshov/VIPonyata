import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "redux/store";

export interface AssessmentState {
    info: any | undefined;
    items: any | undefined;
    selectedItem: any | undefined;
}

const initialState: AssessmentState = {
    info: undefined,
    items: undefined,
    selectedItem: undefined,
};

export const assessmentSlice = createSlice({
    name: "assessment",
    initialState,
    reducers: {
        setAssessmentInfo: (state, action) => {
            state.info = action.payload;
        },
        setAssessmentEndByTime: (state) => {
            state.info.tries[state.info.tries.length - 1].end_datetime = state.info.deadline;
            state.info.deadline = undefined;
        },
        setAssessmentTaskData: (state, action: PayloadAction<{ id: number; data: any }>) => {
            state.items[action.payload.id] = action.payload.data;
        },
        setAssessmentItems: (state, action) => {
            state.items = action.payload;
        },
    },
});

export const selectAssessment = (state: RootState) => state.assessment;

export const { setAssessmentInfo, setAssessmentEndByTime, setAssessmentTaskData, setAssessmentItems } =
    assessmentSlice.actions;

export default assessmentSlice.reducer;
