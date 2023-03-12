import React from "react";
import "./App.css";
import "./RoundBlock.css";
import { AjaxGet, AjaxPost } from "./libs/ServerAPI";
import { useEffect } from "react";
import { UserState, selectUser, setUserData } from "./redux/slices/userSlice";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoadingPage from "./components/LoadingPage";
import LoginPage from "./components/Authentication/LoginPage";
import RegisterPage from "./components/Authentication/RegisterPage";
import StudentMainPage from "./components/MainPage/StudentMainPage";
import TestUpload from "./components/TestUpload";
import NavigateHome from "./components/NavigateHome";
import StudentCoursePage from "./components/Courses/StudentCoursePage";
import NavBar from "./components/NavBar";
import StudentDrillingPage from "./components/Activities/Lexis/Drilling/StudentDrillingPage";
import StudentLessonPage from "./components/Lessons/StudentLessonPage";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { Button } from "react-bootstrap";
import styleThemes from "./themes/StyleThemes.module.css";
import StudentHieroglyphPage from "components/Activities/Lexis/Hieroglyph/StudentHieroglyphPage";
import StudentAssessmentPage from "components/Activities/Assessment/StudentAssessmentPage";

// eslint-disable-next-line
const App = () => {
    const user = useAppSelector(selectUser);
    const dispatch = useAppDispatch();

    useEffect(() => {
        AjaxGet<UserState>({ url: "/api/islogin" }).then((json) => {
            dispatch(setUserData(json));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogout = () => {
        AjaxPost({ url: "/api/logout" }).then(() => {
            dispatch(setUserData({ isAuth: false, userData: undefined }));
        });
    };

    //const getTeacherStudentRoute = (teacher, student) => {
    //    if (user.isAuth === undefined) return;
    //    if (user.data.level === 1) {
    //        return teacher;
    //    } else {
    //        return student;
    //    }
    //};

    const getRoute = (logedTeacher: any, logedStudent: any, unloged: any, additionalCondition = false) => {
        if (user.isAuth === undefined || user.userData === undefined || additionalCondition) {
            return <LoadingPage />;
        } else if (user.isAuth) {
            if (user.userData.level === 1) {
                return logedTeacher;
            } else {
                return logedStudent;
            }
        } else {
            return unloged;
        }
    };

    // TODO Select theme

    return (
        <div className={`${styleThemes.Violet} App`}>
            {user.isAuth !== undefined && <NavBar />}
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={getRoute(<StudentMainPage />, <StudentMainPage />, <LoginPage />)} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/" element={getRoute(<StudentMainPage />, <StudentMainPage />, <LoginPage />)} />

                    <Route
                        path="/courses/:id"
                        element={getRoute(<StudentCoursePage />, <StudentCoursePage />, <NavigateHome />)}
                    />
                    <Route
                        path="/lessons/:id"
                        element={getRoute(<StudentLessonPage />, <StudentLessonPage />, <NavigateHome />)}
                    />
                    <Route
                        path="/drilling/:id/*"
                        element={getRoute(<StudentDrillingPage />, <StudentDrillingPage />, <NavigateHome />)}
                    />
                    <Route
                        path="/hieroglyph/:id/*"
                        element={getRoute(<StudentHieroglyphPage />, <StudentHieroglyphPage />, <NavigateHome />)}
                    />
                    <Route
                        path="/assessment/:id/*"
                        element={getRoute(<StudentAssessmentPage />, <StudentAssessmentPage />, <NavigateHome />)}
                    />
                    <Route path="/upload" element={<TestUpload />} />
                </Routes>
            </BrowserRouter>
            <Button type="button" onClick={handleLogout}>
                Logout
            </Button>
        </div>
    );
};

export default App;
