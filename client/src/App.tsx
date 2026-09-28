import React, { lazy, Suspense, useEffect, useLayoutEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";

import { userQueries } from "api/user";
import ErrorPage from "components/ErrorPages/ErrorPage";
import { isTeacher, resetSession } from "libs/user";

import { useQuery } from "@tanstack/react-query";

import LoginPage from "./components/Authentication/LoginPage";
import Loading from "./components/Common/Loading";
import MainPage from "./components/MainPage/MainPage";
import NavBar from "./components/NavBar";
import NavigateHome from "./components/NavigateHome";
import NotificationsPoller from "./components/Notifications/NotificationsPoller";
import { setUnauthorizedHandler } from "./libs/ServerAPI";
import styleThemes from "./themes/StyleThemes.module.css";

import "./App.css";
import "./RoundBlock.css";

// Страницы грузятся отдельными чанками: ученик не скачивает редакторы учителя и наоборот.
// Барелы (components/Quizlet, components/Tasks) не используем — они склеили бы страницы обеих ролей в один чанк.
const lazyNamed = <M extends Record<string, unknown>, K extends keyof M>(
    load: () => Promise<M>,
    name: K,
): React.LazyExoticComponent<M[K] & React.ComponentType> =>
    lazy(() => load().then((module) => ({ default: module[name] as M[K] & React.ComponentType })));

const loadAssessmentProcessingPage = () =>
    import("components/Activities/Assessment/Assessment/AssessmentProcessingPage");
const AssessmentCreatePage = lazyNamed(loadAssessmentProcessingPage, "AssessmentCreatePage");
const AssessmentEditPage = lazyNamed(loadAssessmentProcessingPage, "AssessmentEditPage");
const StudentAssessmentPage = lazy(() => import("components/Activities/Assessment/StudentAssessmentPage"));
const StudentAssessmentViewDoneTryPage = lazy(
    () => import("components/Activities/Assessment/ViewTry/StudentAssessmentViewDoneTryPage"),
);
const TeacherAssessmentViewDoneTryPage = lazy(
    () => import("components/Activities/Assessment/ViewTry/TeacherAssessmentViewDoneTryPage"),
);
const loadDrillingProcessingPage = () => import("components/Activities/Lexis/Drilling/DrillingProcessingPage");
const DrillingCreatePage = lazyNamed(loadDrillingProcessingPage, "DrillingCreatePage");
const DrillingEditPage = lazyNamed(loadDrillingProcessingPage, "DrillingEditPage");
const StudentDrillingPage = lazy(() => import("components/Activities/Lexis/Drilling/StudentDrillingPage"));
const loadHieroglyphProcessingPage = () => import("components/Activities/Lexis/Hieroglyph/HieroglyphProcessingPage");
const HieroglyphCreatePage = lazyNamed(loadHieroglyphProcessingPage, "HieroglyphCreatePage");
const HieroglyphEditPage = lazyNamed(loadHieroglyphProcessingPage, "HieroglyphEditPage");
const StudentHieroglyphPage = lazy(() => import("components/Activities/Lexis/Hieroglyph/StudentHieroglyphPage"));
const RegisterPage = lazy(() => import("components/Authentication/RegisterPage"));
const StudentProfilePage = lazy(() => import("components/Authentication/StudentProfilePage"));
const CoursePage = lazy(() => import("components/Courses/CoursePage"));
const loadCourseProcessingPage = () => import("components/Courses/CourseProcessingPage");
const CourseCreatePage = lazyNamed(loadCourseProcessingPage, "CourseCreatePage");
const CourseEditPage = lazyNamed(loadCourseProcessingPage, "CourseEditPage");
const DictionaryPage = lazy(() => import("components/Dictionary/DictionaryPage"));
const TeacherHistoryPage = lazy(() => import("components/History/TeacherHistoryPage"));
const loadLessonProcessingPage = () => import("components/Lessons/LessonProcessingPage");
const LessonCreatePage = lazyNamed(loadLessonProcessingPage, "LessonCreatePage");
const LessonEditPage = lazyNamed(loadLessonProcessingPage, "LessonEditPage");
const StudentLessonPage = lazy(() => import("components/Lessons/StudentLessonPage"));
const TeacherLessonPage = lazy(() => import("components/Lessons/TeacherLessonPage"));
const StudentQuizlet = lazy(() => import("components/Quizlet/StudentQuizlet"));
const TeacherQuizletManager = lazy(() => import("components/Quizlet/TeacherQuizletManager"));
const TeacherReview = lazy(() => import("components/Review/TeacherReview"));
const StudentTasksPage = lazy(() => import("components/Tasks/StudentTasksPage"));
const TeacherTasksManager = lazy(() => import("components/Tasks/TeacherTasksManager"));
const WheelTrainerPage = lazy(() => import("components/WheelTrainer/WheelTrainerPage"));

const ScrollToTopOnRouteChange = () => {
    const { pathname } = useLocation();

    useLayoutEffect(() => {
        const scrollToTop = () => {
            window.scrollTo({ top: 0, left: 0, behavior: "auto" });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        };

        scrollToTop();
        const timer = window.setTimeout(scrollToTop, 0);
        return () => window.clearTimeout(timer);
    }, [pathname]);

    return null;
};

const PageLoading = () => (
    <div className="d-flex justify-content-center py-5">
        <Loading size="xl" />
    </div>
);

const App = () => {
    const sessionQuery = useQuery(userQueries.session());

    // Истекшая сессия (401 на любой запрос) — сбрасываем пользователя: роутинг покажет страницу входа.
    useEffect(() => {
        setUnauthorizedHandler(resetSession);
        return () => setUnauthorizedHandler(null);
    }, []);

    // TODO Select theme

    if (sessionQuery.isError) {
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

    if (sessionQuery.isPending) {
        return (
            <div className={`${styleThemes.Violet} App d-flex justify-content-center align-items-center`}>
                <Loading size="xxl" />
            </div>
        );
    }

    const user = sessionQuery.data;

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
                <ScrollToTopOnRouteChange />
                {user.isAuth && <NavBar />}
                {user.isAuth && <NotificationsPoller />}
                <Suspense fallback={<PageLoading />}>
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
                            element={getRoute(
                                <TeacherAssessmentViewDoneTryPage />,
                                <StudentAssessmentViewDoneTryPage />,
                            )}
                        />

                        <Route path="/profile" element={getRoute(<StudentProfilePage />, <StudentProfilePage />)} />

                        <Route path="/dictionary" element={getLoggedRoute(<DictionaryPage />)} />
                        <Route path="/teacher/history" element={getTeacherRoute(<TeacherHistoryPage />)} />
                        <Route
                            path="/teacher/history/students/:studentId"
                            element={getTeacherRoute(<TeacherHistoryPage />)}
                        />
                        <Route path="/teacher/wheel-trainer" element={getTeacherRoute(<WheelTrainerPage />)} />
                        <Route path="/teacher/wheel-trainer/new" element={getTeacherRoute(<WheelTrainerPage />)} />
                        <Route
                            path="/teacher/wheel-trainer/templates"
                            element={getTeacherRoute(<WheelTrainerPage />)}
                        />
                        <Route path="/review/*" element={getTeacherRoute(<TeacherReview />)} />
                        <Route path="/quizlet/*" element={getRoute(<TeacherQuizletManager />, <StudentQuizlet />)} />
                        <Route path="/tasks/*" element={getRoute(<TeacherTasksManager />, <StudentTasksPage />)} />
                        <Route path="/quizlet/lessons/:lessonId" element={getTeacherRoute(<TeacherQuizletManager />)} />
                        <Route path="/quizlet/topics/:topicId" element={getTeacherRoute(<TeacherQuizletManager />)} />
                        <Route
                            path="/quizlet/students-dictionaries/:studentId/topics/:topicId"
                            element={getTeacherRoute(<TeacherQuizletManager />)}
                        />
                        <Route
                            path="/quizlet/view/lessons/:lessonId"
                            element={getRoute(<NavigateHome />, <StudentQuizlet />)}
                        />
                        <Route
                            path="/quizlet/view/lessons/:lessonId/topics/:topicId"
                            element={getRoute(<NavigateHome />, <StudentQuizlet />)}
                        />
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
                </Suspense>
            </BrowserRouter>
        </div>
    );
};

export default App;
