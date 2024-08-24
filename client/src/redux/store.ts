import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";

import assessmentSlice from "./slices/assessmentSlice";
import coursesSlice from "./slices/coursesSlice";
import dictionarySlice from "./slices/dictionarySlice";
import drillingSlice from "./slices/drillingSlice";
import hieroglyphSlice from "./slices/hieroglyphSlice";
import lessonsSlice from "./slices/lessonsSlice";
import loginReducer from "./slices/loginSlice";
import registerSlice from "./slices/registerSlice";
import userReducer from "./slices/userSlice";

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
        dictionary: dictionarySlice,
    },
});

export default store;

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;
