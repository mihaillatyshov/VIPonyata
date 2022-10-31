import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "redux/store";

export interface DrillingState {
    info: any | undefined;
    items: any | undefined;
    selectedItem: any | undefined;
}

const initialState: DrillingState = {
    info: undefined,
    items: undefined,
    selectedItem: undefined,
};

export const drillingSlice = createSlice({
    name: "drilling",
    initialState,
    reducers: {
        setDrillingInfo: (state, action) => {
            state.info = action.payload;
        },
        setDrillingEndByTime: (state) => {
            state.info.tries[state.info.tries.length - 1].EndTime = state.info.Deadline;
            state.info.Deadline = undefined;
        },
        setDrillingDoneTask: (state, action) => {
            state.info.try.DoneTasks = action.payload;
        },
        setDrillingItems: (state, action) => {
            state.items = action.payload;
        },
        setDrillingSelectedItem: (state, action) => {
            state.selectedItem = action.payload;
        },
        setDrillingSelectedItemField: (state, action) => {
            for (const key in action.payload) state.selectedItem[key] = action.payload[key];
        },
        addDrillingDoneTash: (state, action) => {
            state.info.DoneTasks[action.payload.name] = action.payload.percent;
        },
    },
});

export const selectDrilling = (state: RootState) => state.drilling;

export const {
    setDrillingInfo,
    setDrillingEndByTime,
    setDrillingDoneTask,
    setDrillingItems,
    setDrillingSelectedItem,
    setDrillingSelectedItemField,
} = drillingSlice.actions;

export default drillingSlice.reducer;
