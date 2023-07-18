import React, { useEffect } from "react";
import { AjaxGet } from "libs/ServerAPI";
import { selectCourses, setCourses } from "redux/slices/coursesSlice";
import CourseCard from "./CourseCard";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { TCourse } from "models/TCourse";

type ResponseData = {
    items: TCourse[];
};

const StudentCoursesList = () => {
    const courses = useAppSelector(selectCourses);
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(setCourses(undefined));
        AjaxGet<ResponseData>({
            url: "/api/courses",
        }).then((json) => {
            dispatch(setCourses(json.items));
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (courses.items === undefined) {
        return <div> Loading... </div>;
    }
    if (courses.items.length === 0) {
        return <div>No Items</div>;
    }

    return (
        <div className="row justify-content-center">
            {courses.items.map((course) => {
                return <CourseCard course={course} key={course.id} />;
            })}
        </div>
    );
};

export default StudentCoursesList;
