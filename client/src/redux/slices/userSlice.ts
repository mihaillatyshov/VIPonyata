import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface UserState {
    isAuth: boolean | undefined;
    data: any | undefined;
}

const initialState: UserState = {
    isAuth: undefined,
    data: undefined,
};

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUserData: (state, action) => {
            state.isAuth = action.payload.isAuth;
            state.data = action.payload.userData;
        },
    },
});

export const selectUser = (state: RootState) => state.user;

export const { setUserData } = userSlice.actions;

export default userSlice.reducer;
