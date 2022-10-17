import { createSlice } from "@reduxjs/toolkit";

const initialState = {
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
    initialState: initialState,
    reducers: {
        resetRegisterForm: (state) => {
            // eslint-disable-next-line
            Object.keys(initialState).map((val) => {
                state[val] = initialState[val];
            });
        },
        setRegisterValidated: (state) => {
            state.validated = true;
        },
        setRegisterMessage: (state, action) => {
            state.message = action.payload;
        },
        setRegisterNickname: (state, action) => {
            state.nickname = action.payload;
        },
        seRegisterPassword1: (state, action) => {
            state.password1 = action.payload;
        },
        setRegisterPassword2: (state, action) => {
            state.password2 = action.payload;
        },
        setRegisterName: (state, action) => {
            state.name = action.payload;
        },
        setRegisterBirthday: (state, action) => {
            state.birthday = action.payload;
        },
    },
});

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
