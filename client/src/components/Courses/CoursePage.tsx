import React, { useEffect } from "react";

import PageDescription from "components/Common/PageDescription";
import PageTitle from "components/Common/PageTitle";
import LessonsList from "components/Lessons/LessonsList";
import { AjaxGet } from "libs/ServerAPI";
import { TCourse } from "models/TCourse";
import { TLesson } from "models/TLesson";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { selectCourses, setSelectedCourse } from "redux/slices/coursesSlice";
import { setLessons } from "redux/slices/lessonsSlice";

type ResponseData = {
    course: TCourse;
    items: TLesson[];
};

const CoursePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const course = useAppSelector(selectCourses).selected;

    useEffect(() => {
        dispatch(setSelectedCourse(undefined));
        dispatch(setLessons(undefined));
        AjaxGet<ResponseData>({ url: `/api/courses/${id}` })
            .then((json) => {
                dispatch(setSelectedCourse(json.course));
                dispatch(setLessons(json.items));
            })
            .catch(({ isServerError, json, response }) => {
                if (!isServerError) {
                    if (response.status === 404 || response.status === 403) navigate("/", { replace: true });
                }
            });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="container" style={{ maxWidth: "640px" }}>
            <PageTitle title={course?.name} urlBack="/" />
            <PageDescription className="mb-5" description={course?.description} isCentered={true} />
            <LessonsList />
        </div>
    );
};

export default CoursePage;
