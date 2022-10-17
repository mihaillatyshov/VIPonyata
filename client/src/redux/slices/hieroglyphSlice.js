import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    info: undefined,
};

export const hieroglyphSlice = createSlice({
    name: "hieroglyph",
    initialState: initialState,
    reducers: {
        setHieroglyphInfo: (state, action) => {
            state.info = action.payload;
        },
    },
});

export const { setHieroglyphInfo } = hieroglyphSlice.actions;

export default hieroglyphSlice.reducer;
