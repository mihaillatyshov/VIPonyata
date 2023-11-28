import React, { useLayoutEffect } from "react";

import ErrorPage from "components/ErrorPages/ErrorPage";
import { AjaxGet } from "libs/ServerAPI";
import { TCourse } from "models/TCourse";
import { useUserIsTeacher } from "redux/funcs/user";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { selectCourses, setCourses } from "redux/slices/coursesSlice";

import CourseCardCreate from "./Cards/CourseCardCreate";
import CourseCardLoading from "./Cards/CourseCardLoading";
import CourseCardWithContent from "./Cards/CourseCardWithContent";

type ResponseData = {
    items: TCourse[];
};

const CoursesList = () => {
    const courses = useAppSelector(selectCourses);
    const dispatch = useAppDispatch();

    const isTeacher = useUserIsTeacher();

    useLayoutEffect(() => {
        AjaxGet<ResponseData>({
            url: "/api/courses",
        }).then((json) => {
            dispatch(setCourses(json.items));
        });

        return () => {
            dispatch(setCourses(undefined));
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (courses.items === undefined) {
        return (
            <div className="row justify-content-center">
                {Array.from(Array(12)).map((_, i) => (
                    <CourseCardLoading key={i} />
                ))}
            </div>
        );
    }

    if (!isTeacher && courses.items.length === 0) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Нет доступных курсов"
                textDisabled="Попросите Машу открыть вам доступ :3"
                needReload={false}
            />
        );
    }

    return (
        <div className="row justify-content-center">
            <CourseCardCreate />
            {courses.items.map((course) => {
                return <CourseCardWithContent key={course.id} course={course} />;
            })}
        </div>
    );
};

export default CoursesList;
