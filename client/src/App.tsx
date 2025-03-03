import React, { useLayoutEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import {
    AssessmentCreatePage,
    AssessmentEditPage,
} from "components/Activities/Assessment/Assessment/AssessmentProcessingPage";
import StudentAssessmentPage from "components/Activities/Assessment/StudentAssessmentPage";
import StudentAssessmentViewDoneTryPage from "components/Activities/Assessment/ViewTry/StudentAssessmentViewDoneTryPage";
import TeacherAssessmentViewDoneTryPage from "components/Activities/Assessment/ViewTry/TeacherAssessmentViewDoneTryPage";
import { DrillingCreatePage, DrillingEditPage } from "components/Activities/Lexis/Drilling/DrillingProcessingPage";
import {
    HieroglyphCreatePage,
    HieroglyphEditPage,
} from "components/Activities/Lexis/Hieroglyph/HieroglyphProcessingPage";
import StudentHieroglyphPage from "components/Activities/Lexis/Hieroglyph/StudentHieroglyphPage";
import StudentProfilePage from "components/Authentication/StudentProfilePage";
import { CourseCreatePage, CourseEditPage } from "components/Courses/CourseProcessingPage";
import DictionaryPage from "components/Dictionary/DictionaryPage";
import ErrorPage from "components/ErrorPages/ErrorPage";
import { LessonCreatePage, LessonEditPage } from "components/Lessons/LessonProcessingPage";
import TeacherLessonPage from "components/Lessons/TeacherLessonPage";
import { LoadStatus } from "libs/Status";
import { isTeacher } from "redux/funcs/user";

import StudentDrillingPage from "./components/Activities/Lexis/Drilling/StudentDrillingPage";
import LoginPage from "./components/Authentication/LoginPage";
import RegisterPage from "./components/Authentication/RegisterPage";
import Loading from "./components/Common/Loading";
import CoursePage from "./components/Courses/CoursePage";
import StudentLessonPage from "./components/Lessons/StudentLessonPage";
import MainPage from "./components/MainPage/MainPage";
import NavBar from "./components/NavBar";
import NavigateHome from "./components/NavigateHome";
import { AjaxGet } from "./libs/ServerAPI";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { selectUser, setUserData, UserDataType } from "./redux/slices/userSlice";
import styleThemes from "./themes/StyleThemes.module.css";

import "./RoundBlock.css";
import "./App.css";

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
        unloggedRoute: React.ReactNode = <NavigateHome />,
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
                    <Route path="/" element={getRoute(<MainPage />, <MainPage />, <LoginPage />)} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route path="/courses/:id" element={getLoggedRoute(<CoursePage />)} />
                    <Route path="/courses/create" element={getTeacherRoute(<CourseCreatePage />)} />
                    <Route path="/courses/edit/:id" element={getTeacherRoute(<CourseEditPage />)} />

                    <Route path="/lessons/:id" element={getRoute(<TeacherLessonPage />, <StudentLessonPage />)} />
                    <Route path="/lessons/create/:id" element={getTeacherRoute(<LessonCreatePage />)} />
                    <Route path="/lessons/edit/:id" element={getTeacherRoute(<LessonEditPage />)} />

                    <Route
                        path="/drilling/:id/*"
                        element={getRoute(<StudentDrillingPage />, <StudentDrillingPage />)}
                    />
                    <Route path="/drilling/create/:id" element={getTeacherRoute(<DrillingCreatePage />)} />
                    <Route path="/drilling/edit/:id" element={getTeacherRoute(<DrillingEditPage />)} />

                    <Route
                        path="/hieroglyph/:id/*"
                        element={getRoute(<StudentHieroglyphPage />, <StudentHieroglyphPage />)}
                    />
                    <Route path="/hieroglyph/create/:id" element={getTeacherRoute(<HieroglyphCreatePage />)} />
                    <Route path="/hieroglyph/edit/:id" element={getTeacherRoute(<HieroglyphEditPage />)} />

                    <Route
                        path="/assessment/:assessmentId"
                        element={getRoute(<StudentAssessmentPage />, <StudentAssessmentPage />)}
                    />
                    <Route path="/assessment/create/:id" element={getTeacherRoute(<AssessmentCreatePage />)} />
                    <Route path="/assessment/edit/:id" element={getTeacherRoute(<AssessmentEditPage />)} />
                    <Route
                        path="/assessment/try/:id"
                        element={getRoute(<TeacherAssessmentViewDoneTryPage />, <StudentAssessmentViewDoneTryPage />)}
                    />

                    <Route path="/profile" element={getRoute(<StudentProfilePage />, <StudentProfilePage />)} />

                    <Route path="/dictionary" element={getLoggedRoute(<DictionaryPage />)} />
                    <Route
                        path="*"
                        element={
                            <ErrorPage
                                errorImg="/svg/SomethingWrong.svg"
                                textMain="Такой страницы не существует"
                                needReload={false}
                            />
                        }
                    />
                </Routes>
            </BrowserRouter>
        </div>
    );
};

export default App;
