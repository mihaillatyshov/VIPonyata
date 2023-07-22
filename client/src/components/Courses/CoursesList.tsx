import React, { useLayoutEffect } from "react";
import { AjaxGet } from "libs/ServerAPI";
import { selectCourses, setCourses } from "redux/slices/coursesSlice";
import CourseCardWithContent from "./Cards/CourseCardWithContent";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { TCourse } from "models/TCourse";
import CourseCardCreate from "./Cards/CourseCardCreate";
import CourseCardLoading from "./Cards/CourseCardLoading";

type ResponseData = {
    items: TCourse[];
};

const CoursesList = () => {
    const courses = useAppSelector(selectCourses);
    const dispatch = useAppDispatch();

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

    if (courses.items.length === 0) {
        return <div>No Items</div>;
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
