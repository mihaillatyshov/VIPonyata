import { LoadStatus } from "libs/Status";
import { TUserData } from "models/TUser";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "../store";

export interface TAuthorizedUser {
    isAuth: true;
    userData: TUserData;
}

export interface TNotAuthorizedUser {
    isAuth: false;
}

export type UserDataType = TAuthorizedUser | TNotAuthorizedUser;

export type UserDataState = LoadStatus.DataDoneOrNotDone<UserDataType>;

interface UserState {
    data: UserDataState;
}

const initialState: UserState = {
    data: { loadStatus: LoadStatus.NONE },
};

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUserData: (state, action: PayloadAction<UserDataState>) => {
            state.data = action.payload;
        },
    },
});

export const selectUser = (state: RootState) => state.user;
export const { setUserData } = userSlice.actions;
export default userSlice.reducer;
