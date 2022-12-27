import React from "react";
import "./App.css";
import "./RoundBlock.css";
import { ServerAPI_GET, ServerAPI_POST } from "./libs/ServerAPI";
import { useEffect } from "react";
import { selectUser, setUserData } from "./redux/slices/userSlice";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoadingPage from "./components/LoadingPage";
import LoginPage from "./components/Authentication/LoginPage";
import RegisterPage from "./components/Authentication/RegisterPage";
import StudentMainPage from "./components/MainPage/StudentMainPage";
import TestUpload from "./components/TestUpload";
import NavigateHome from "./components/NavigateHome";
import StudentCoursePage from "./components/Courses/StudentCoursePage";
import NavBar from "./components/NavBar";
import StudentDrillingPage from "./components/Courses/Lessons/DAH/Drilling/StudentDrillingPage";
import StudentLessonPage from "./components/Courses/Lessons/StudentLessonPage";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { Button } from "react-bootstrap";
import styleThemes from "./themes/StyleThemes.module.css";
import { LogInfo } from "libs/Logger";

// eslint-disable-next-line
const App = () => {
    const user = useAppSelector(selectUser);
    const dispatch = useAppDispatch();

    useEffect(() => {
        ServerAPI_GET({
            url: "/api/islogin",
            onDataReceived: (data) => {
                LogInfo(data);
                dispatch(setUserData(data));
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogout = () => {
        ServerAPI_POST({
            url: "/api/logout",
            onDataReceived: (data) => {
                console.log(data);
                dispatch(setUserData({ isAuth: false, userData: {} }));
            },
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
        if (user.isAuth === undefined || user.data === undefined || additionalCondition) {
            return <LoadingPage />;
        } else if (user.isAuth) {
            if (user.data.level === 1) {
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
