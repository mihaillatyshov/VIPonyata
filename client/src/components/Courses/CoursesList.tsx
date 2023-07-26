import React, { useLayoutEffect } from "react";
import { AjaxGet } from "libs/ServerAPI";
import { selectCourses, setCourses } from "redux/slices/coursesSlice";
import CourseCardWithContent from "./Cards/CourseCardWithContent";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { TCourse } from "models/TCourse";
import CourseCardCreate from "./Cards/CourseCardCreate";
import CourseCardLoading from "./Cards/CourseCardLoading";
import { useUserIsTeacher } from "redux/funcs/user";

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
            <div className="row justify-content-center mt-5">
                {Array.from(Array(12)).map((_, i) => (
                    <CourseCardLoading key={i} />
                ))}
            </div>
        );
    }

    if (!isTeacher && courses.items.length === 0) {
        return <div>No Items</div>; // TODO: add placeholder
    }

    return (
        <div className="row justify-content-center mt-5">
            <CourseCardCreate />
            {courses.items.map((course) => {
                return <CourseCardWithContent key={course.id} course={course} />;
            })}
        </div>
    );
};

export default CoursesList;
