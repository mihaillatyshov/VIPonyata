import { TTeacherAssessmentItems } from "models/Activity/Items/TAssessmentItems";
import { RootState } from "redux/store";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AssessmentState {
    info: any; // TODO: RemoveAny
    items: TTeacherAssessmentItems | undefined;
}

const initialState: AssessmentState = {
    info: undefined,
    items: undefined,
};

export const assessmentSlice = createSlice({
    name: "assessment",
    initialState,
    reducers: {
        setAssessmentInfo: (state, action) => {
            state.info = action.payload;
        },
        setAssessmentEndByTime: (state) => {
            if (state?.info?.tries) {
                const lastTry = state.info.tries[state.info.tries.length - 1];
                if (lastTry.end_datetime === null) {
                    lastTry.end_datetime = state.info.deadline;
                }
                state.info.deadline = null;
            }
        },
        setAssessmentTaskData: (state, action: PayloadAction<{ id: number; data: any }>) => {
            if (state.items === undefined) {
                return;
            }

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
