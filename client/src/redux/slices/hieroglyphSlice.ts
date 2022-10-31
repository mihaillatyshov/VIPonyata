import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "redux/store";

export interface HieroglyphSlice {
    info: any | undefined;
}

const initialState = {
    info: undefined,
};

export const hieroglyphSlice = createSlice({
    name: "hieroglyph",
    initialState,
    reducers: {
        setHieroglyphInfo: (state, action) => {
            state.info = action.payload;
        },
    },
});

export const selectHieroglyph = (state: RootState) => state.hyeroglyph;

export const { setHieroglyphInfo } = hieroglyphSlice.actions;

export default hieroglyphSlice.reducer;
