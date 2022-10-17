import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import loginReducer from "./slices/loginSlice";
import registerSlice from "./slices/registerSlice";
import coursesSlice from "./slices/coursesSlice";
import lessonsSlice from "./slices/lessonsSlice";
import drillingSlice from "./slices/drillingSlice";
import assessmentSlice from "./slices/assessmentSlice";
import hieroglyphSlice from "./slices/hieroglyphSlice";

export default configureStore({
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
