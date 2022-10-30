import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { ServerAPI_GET } from "libs/ServerAPI";
import { setSelectedCourse } from "redux/slices/coursesSlice";
import { setLessons } from "redux/slices/lessonsSlice";
import StudentLessonsBlock from "components/Courses/Lessons/StudentLessonsBlock";
import style from "./StyleCourses.module.css";
import { LogInfo } from "libs/Logger";

const StudentCoursePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const course = useSelector((state) => state.courses.selected);

    useEffect(() => {
        dispatch(setSelectedCourse(undefined));
        dispatch(setLessons(undefined));
        ServerAPI_GET({
            url: `/api/courses/${id}`,
            onDataReceived: (data) => {
                LogInfo(data);
                dispatch(setSelectedCourse(data.course));
                dispatch(setLessons(data.items));
            },
            handleStatus: (res) => {
                LogInfo(res.status);
                if (res.status === 403) navigate("/");
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="container">
            <div className="row">
                <div className={"col-auto " + style.mainTitle}>{course && course.Name}</div>
            </div>
            <StudentLessonsBlock />
        </div>
    );
};

export default StudentCoursePage;
