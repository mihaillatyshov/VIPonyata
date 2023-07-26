import React, { useLayoutEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AjaxGet } from "libs/ServerAPI";
import { selectCourses, setSelectedCourse } from "redux/slices/coursesSlice";
import { setLessons } from "redux/slices/lessonsSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import StudentLessonsList from "components/Lessons/StudentLessonsList";
import { TCourse } from "models/TCourse";
import { TLesson } from "models/TLesson";

import style from "./StyleCourses.module.css";

type ResponseData = {
    course: TCourse;
    items: TLesson[];
};

const CoursePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const course = useAppSelector(selectCourses).selected;

    useLayoutEffect(() => {
        AjaxGet<ResponseData>({ url: `/api/courses/${id}` })
            .then((json) => {
                dispatch(setSelectedCourse(json.course));
                dispatch(setLessons(json.items));
            })
            .catch(({ isServerError, json, response }) => {
                if (!isServerError && (response.status === 404 || response.status === 403)) {
                    navigate("/");
                }
            });

        return () => {
            dispatch(setSelectedCourse(undefined));
            dispatch(setLessons(undefined));
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="container">
            <div className="row">
                <div className={"col-auto " + style.mainTitle}>{course?.name}</div>
            </div>
            <StudentLessonsList />
        </div>
    );
};

export default CoursePage;
