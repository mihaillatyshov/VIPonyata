import "./App.css";
import "./RoundBlock.css";
import LoginPage from "./components/Authentication/LoginPage";
import { ServerAPI_GET } from "./libs/ServerAPI";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setUserData } from "./redux/slices/userSlice";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoadingPage from "./components/LoadingPage";
import StudentMainPage from "./components/MainPage/StudentMainPage";
import RegisterPage from "./components/Authentication/RegisterPage";
import TestUpload from "./components/TestUpload";
import NavigateHome from "./components/NavigateHome";
import StudentCoursePage from "./components/Courses/StudentCoursePage";
import StudentLessonPage from "./components/Lessons/StudentLessonPage";
import StudentDrillingPage from "./components/Drilling/StudentDrillingPage";
import NavBar from "./components/NavBar";

// eslint-disable-next-line
const App = () => {
    const user = useSelector((state) => state.user);
    const dispatch = useDispatch();

    useEffect(() => {
        ServerAPI_GET({
            url: "/api/islogin",
            onDataReceived: (data) => {
                dispatch(setUserData(data));
            },
        });
    }, []);

    const getTeacherStudentRoute = (teacher, student) => {
        if (user.isAuth === undefined) return;
        if (user.data.level === 1) {
            return teacher;
        } else {
            return student;
        }
    };

    const getRoute = (logedTeacher, logedStudent, unloged, additionalCondition = false) => {
        if (user.isAuth === undefined || additionalCondition) {
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

    const StyleVioled = {
        "--css-var-bg": "#E1D8E8",
        "--css-var-block": "#BFACE0",
        "--css-var-title": "#A084CA",
        "--css-var-other": "#A084CA",
    };

    return (
        <div style={StyleVioled} className="App">
            {user.isAuth !== undefined && <NavBar />}
            <BrowserRouter>
                <Routes>
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
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/upload" element={<TestUpload />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
};

export default App;
