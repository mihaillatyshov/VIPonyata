import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { TUserData } from "models/TUser";

type UserDataType = TUserData | undefined;

export interface UserState {
    isAuth: boolean | undefined;
    userData: UserDataType;
}

const initialState: UserState = {
    isAuth: undefined,
    userData: undefined,
};

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUserData: (state, action: PayloadAction<UserState>) => {
            state.isAuth = action.payload.isAuth;
            state.userData = action.payload.userData;
        },
    },
});

export const selectUser = (state: RootState) => state.user;

export const { setUserData } = userSlice.actions;

export const isTeacher = (userData: TUserData) => userData.level === 1;
export const isStudent = (userData: TUserData) => userData.level !== 1;

export default userSlice.reducer;
