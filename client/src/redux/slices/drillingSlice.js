import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    info: undefined,
    items: undefined,
    selectedItem: undefined,
};

export const drillingSlice = createSlice({
    name: "drilling",
    initialState: initialState,
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

export const {
    setDrillingInfo,
    setDrillingEndByTime,
    setDrillingDoneTask,
    decDrillingTimeRemaining,
    setDrillingItems,
    setDrillingSelectedItem,
    setDrillingSelectedItemField,
} = drillingSlice.actions;

export default drillingSlice.reducer;
