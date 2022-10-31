import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import loginReducer from "./slices/loginSlice";
import registerSlice from "./slices/registerSlice";
import coursesSlice from "./slices/coursesSlice";
import lessonsSlice from "./slices/lessonsSlice";
import drillingSlice from "./slices/drillingSlice";
import assessmentSlice from "./slices/assessmentSlice";
import hieroglyphSlice from "./slices/hieroglyphSlice";

const store = configureStore({
    reducer: {
        user: userReducer,
        login: loginReducer,
        register: registerSlice,
        courses: coursesSlice,
        lessons: lessonsSlice,
        drilling: drillingSlice,
        assessment: assessmentSlice,
        hyeroglyph: hieroglyphSlice,
    },
});

export default store;

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;
