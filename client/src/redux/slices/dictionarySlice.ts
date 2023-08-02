import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { LoadStatus } from "libs/Status";
import { TDictionary } from "models/TDictionary";
import { RootState } from "redux/store";

type DictionaryType = LoadStatus.DataDoneOrNotDone<{ items: TDictionary }>;

export interface DictionaryState {
    dictionary: DictionaryType;
}

const initialState: DictionaryState = {
    dictionary: { loadStatus: LoadStatus.NONE },
};

export const dictionarySlice = createSlice({
    name: "dictionary",
    initialState,
    reducers: {
        setDictionary: (state, action: PayloadAction<DictionaryType>) => {
            state.dictionary = action.payload;
        },
    },
});

export const selectDictionary = (state: RootState) => state.dictionary;

export const { setDictionary } = dictionarySlice.actions;

export default dictionarySlice.reducer;
