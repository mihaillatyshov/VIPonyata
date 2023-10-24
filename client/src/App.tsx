import "./App.css";
import "./RoundBlock.css";

import React, { useLayoutEffect } from "react";

import { AssessmentCreatePage } from "components/Activities/Assessment/CreatePage";
import StudentAssessmentPage from "components/Activities/Assessment/StudentAssessmentPage";
import DrillingCreatePage from "components/Activities/Lexis/Drilling/DrillingCreatePage";
import HieroglyphCreatePage from "components/Activities/Lexis/Hieroglyph/HieroglyphCreatePage";
import StudentHieroglyphPage from "components/Activities/Lexis/Hieroglyph/StudentHieroglyphPage";
import StudentProfilePage from "components/Authentication/StudentProfilePage";
import CourseCreatePage from "components/Courses/CourseCreatePage";
import DictionaryPage from "components/Dictionary/DictionaryPage";
import ErrorPage from "components/ErrorPages/ErrorPage";
import LessonCreatePage from "components/Lessons/LessonCreatePage";
import TeacherLessonPage from "components/Lessons/TeacherLessonPage";
import { LoadStatus } from "libs/Status";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { isTeacher } from "redux/funcs/user";

import StudentDrillingPage from "./components/Activities/Lexis/Drilling/StudentDrillingPage";
import LoginPage from "./components/Authentication/LoginPage";
import RegisterPage from "./components/Authentication/RegisterPage";
import Loading from "./components/Common/Loading";
import CoursePage from "./components/Courses/CoursePage";
import StudentLessonPage from "./components/Lessons/StudentLessonPage";
import StudentMainPage from "./components/MainPage/StudentMainPage";
import NavBar from "./components/NavBar";
import NavigateHome from "./components/NavigateHome";
import TestUpload from "./components/TestUpload";
import { AjaxGet } from "./libs/ServerAPI";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { selectUser, setUserData, UserDataType } from "./redux/slices/userSlice";
import styleThemes from "./themes/StyleThemes.module.css";

const App = () => {
    const user = useAppSelector(selectUser).data;
    const dispatch = useAppDispatch();

    useLayoutEffect(() => {
        AjaxGet<UserDataType>({ url: "/api/islogin" })
            .then((json) => {
                dispatch(setUserData({ loadStatus: LoadStatus.DONE, ...json }));
            })
            .catch(({ isServerError, json, response }) => {
                dispatch(setUserData({ loadStatus: LoadStatus.ERROR }));
            });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // TODO Select theme

    if (user.loadStatus === LoadStatus.ERROR) {
        return (
            <div className={`${styleThemes.Violet} App d-flex justify-content-center align-items-center`}>
                <BrowserRouter>
                    <ErrorPage
                        errorImg="/svg/SomethingWrong.svg"
                        textMain="Упс! Произошла непредвиденная ошибка"
                        textDisabled="Попробуйте перезагрузить страницу"
                    />
                </BrowserRouter>
            </div>
        );
    }

    if (user.loadStatus !== LoadStatus.DONE) {
        return (
            <div className={`${styleThemes.Violet} App d-flex justify-content-center align-items-center`}>
                <Loading size="xxl" />
            </div>
        );
    }

    const getRoute = (
        teacherRoute: React.ReactNode,
        studentRoute: React.ReactNode,
        unloggedRoute: React.ReactNode = <NavigateHome />
    ) => {
        if (user.isAuth) {
            return isTeacher(user.userData) ? teacherRoute : studentRoute;
        } else {
            return unloggedRoute;
        }
    };

    const getLoggedRoute = (loggedRoute: React.ReactNode) => {
        return user.isAuth ? loggedRoute : <NavigateHome />;
    };

    const getTeacherRoute = (teacherRoute: React.ReactNode) => {
        return user.isAuth && isTeacher(user.userData) ? teacherRoute : <NavigateHome />;
    };

    return (
        <div className={`${styleThemes.Violet} App`}>
            <BrowserRouter>
                {user.isAuth && <NavBar />}
                <Routes>
                    <Route path="/" element={getRoute(<StudentMainPage />, <StudentMainPage />, <LoginPage />)} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route path="/courses/:id" element={getLoggedRoute(<CoursePage />)} />
                    <Route path="/courses/create" element={getTeacherRoute(<CourseCreatePage />)} />

                    <Route path="/lessons/:id" element={getRoute(<TeacherLessonPage />, <StudentLessonPage />)} />
                    <Route path="/lessons/create/:courseId" element={getTeacherRoute(<LessonCreatePage />)} />

                    <Route
                        path="/drilling/:id/*"
                        element={getRoute(<StudentDrillingPage />, <StudentDrillingPage />)}
                    />
                    <Route path="/drilling/create/:lessonId" element={getTeacherRoute(<DrillingCreatePage />)} />

                    <Route
                        path="/hieroglyph/:id/*"
                        element={getRoute(<StudentHieroglyphPage />, <StudentHieroglyphPage />)}
                    />
                    <Route path="/hieroglyph/create/:lessonId" element={getTeacherRoute(<HieroglyphCreatePage />)} />

                    <Route
                        path="/assessment/:id/*"
                        element={getRoute(<StudentAssessmentPage />, <StudentAssessmentPage />)}
                    />
                    <Route path="/assessment/create/:lessonId" element={getTeacherRoute(<AssessmentCreatePage />)} />

                    <Route path="/profile" element={getRoute(<StudentProfilePage />, <StudentProfilePage />)} />

                    <Route path="/dictionary" element={getLoggedRoute(<DictionaryPage />)} />

                    <Route path="/upload" element={<TestUpload />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
};

export default App;
