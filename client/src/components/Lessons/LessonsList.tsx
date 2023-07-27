import React from "react";
import { useAppSelector } from "redux/hooks";
import { selectLessons } from "redux/slices/lessonsSlice";
import { useUserIsTeacher } from "redux/funcs/user";
import LessonCardWithContent from "./Cards/LessonCardWithContent";
import LessonCardCreate from "./Cards/LessonCardCreate";
import { selectCourses } from "redux/slices/coursesSlice";
import ErrorPage from "components/ErrorPages/ErrorPage";
import LessonCardLoading from "./Cards/LessonCardLoading";

const LessonsList = () => {
    const course = useAppSelector(selectCourses).selected;
    const lessons = useAppSelector(selectLessons);

    const isTeacher = useUserIsTeacher();

    if (lessons.items === undefined || course === undefined) {
        return (
            <div className="row justify-content-center mt-5 mx-0 px-0">
                {Array.from(Array(12)).map((_, i) => (
                    <LessonCardLoading key={i} />
                ))}
            </div>
        );
    }

    if (!isTeacher && lessons.items.length === 0) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Нет доступных уроков"
                textDisabled="Попросите Машу открыть вам досутуп к урокам :3"
                needReload={false}
            />
        );
    }

    return (
        <div className=" mt-5">
            <LessonCardCreate courseId={course.id} />
            {lessons.items.map((lesson) => {
                return <LessonCardWithContent key={lesson.id} lesson={lesson} />;
            })}
            {isTeacher && lessons.items.length === 0 && (
                <ErrorPage errorImg="/svg/SomethingWrong.svg" textMain="Нет созданных уроков" needReload={false} />
            )}
        </div>
    );
};

export default LessonsList;
