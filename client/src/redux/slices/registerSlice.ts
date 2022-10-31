import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "redux/store";

export interface RegisterState {
    validated: boolean;
    message: string;
    nickname: string;
    password1: string;
    password2: string;
    name: string;
    birthday: string;
}

const initialState: RegisterState = {
    validated: false,
    message: "",
    nickname: "",
    password1: "",
    password2: "",
    name: "",
    birthday: "",
};

export const registerSlice = createSlice({
    name: "register",
    initialState,
    reducers: {
        resetRegisterForm: (state) => {
            return initialState;
        },
        setRegisterValidated: (state) => {
            state.validated = true;
        },
        setRegisterMessage: (state, action: PayloadAction<string>) => {
            state.message = action.payload;
        },
        setRegisterNickname: (state, action: PayloadAction<string>) => {
            state.nickname = action.payload;
        },
        setRegisterPassword1: (state, action: PayloadAction<string>) => {
            state.password1 = action.payload;
        },
        setRegisterPassword2: (state, action: PayloadAction<string>) => {
            state.password2 = action.payload;
        },
        setRegisterName: (state, action: PayloadAction<string>) => {
            state.name = action.payload;
        },
        setRegisterBirthday: (state, action: PayloadAction<string>) => {
            state.birthday = action.payload;
        },
    },
});

export const selectRegister = (state: RootState) => state.register;

export const {
    resetRegisterForm,
    setRegisterValidated,
    setRegisterMessage,
    setRegisterNickname,
    setRegisterPassword1,
    setRegisterPassword2,
    setRegisterName,
    setRegisterBirthday,
} = registerSlice.actions;

export default registerSlice.reducer;
