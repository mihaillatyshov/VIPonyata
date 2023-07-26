import React from "react";
import { useAppSelector } from "redux/hooks";
import { selectLessons } from "redux/slices/lessonsSlice";
import LessonCard from "./LessonCard";
import { useUserIsTeacher } from "redux/funcs/user";
import LessonCardWithContent from "./Cards/LessonCardWithContent";
import LessonCardCreate from "./Cards/LessonCardCreate";
import { selectCourses } from "redux/slices/coursesSlice";

const StudentLessonsList = () => {
    const course = useAppSelector(selectCourses).selected;
    const lessons = useAppSelector(selectLessons);

    const isTeacher = useUserIsTeacher();

    if (lessons.items === undefined || course === undefined) {
        return <div> Loading... </div>;
    }

    if (!isTeacher && lessons.items.length === 0) {
        return <div>No Items</div>;
    }

    return (
        <div>
            <LessonCardCreate courseId={course.id} />
            {lessons.items.map((lesson) => {
                return <LessonCardWithContent key={lesson.id} lesson={lesson} />;
            })}
        </div>
    );
};

export default StudentLessonsList;
