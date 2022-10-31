import React, { useEffect } from "react";
import { ServerAPI_GET } from "libs/ServerAPI";
import { selectCourses, setCourses } from "redux/slices/coursesSlice";
import CourseCard from "./CourseCard";
import { useAppDispatch, useAppSelector } from "redux/hooks";

const StudentCorsesList = () => {
    const courses = useAppSelector(selectCourses);
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(setCourses(undefined));
        ServerAPI_GET({
            url: "/api/courses",
            onDataReceived: (data) => {
                console.log(data);
                dispatch(setCourses(data.items));
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            {courses.items === undefined ? (
                <div> Loading... </div>
            ) : courses.items.length > 0 ? (
                <div className="row justify-content-center">
                    {courses.items.map((course) => {
                        return <CourseCard course={course} key={course.Id} />;
                    })}
                </div>
            ) : (
                <div>No Items</div>
            )}
        </>
    );
};

export default StudentCorsesList;
