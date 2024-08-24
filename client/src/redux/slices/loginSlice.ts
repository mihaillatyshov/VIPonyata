import { RootState } from "redux/store";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface LoginState {
    validated: boolean;
    nickname: string;
    password: string;
}

const initialState: LoginState = {
    validated: false,
    nickname: "",
    password: "",
};

export const loginSlice = createSlice({
    name: "login",
    initialState,
    reducers: {
        resetLoginForm: () => {
            return initialState;
        },
        setLoginValidated: (state) => {
            state.validated = true;
        },
        setLoginNickname: (state, action: PayloadAction<string>) => {
            state.nickname = action.payload;
        },
        setLoginPassword: (state, action: PayloadAction<string>) => {
            state.password = action.payload;
        },
    },
});

export const selectLogin = (state: RootState) => state.login;

export const { resetLoginForm, setLoginValidated, setLoginNickname, setLoginPassword } = loginSlice.actions;

export default loginSlice.reducer;
