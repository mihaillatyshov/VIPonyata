import { coursesQueries } from "api/courses";
import ErrorPage from "components/ErrorPages/ErrorPage";
import { useUserIsTeacher } from "libs/user";

import { useQuery } from "@tanstack/react-query";

import CourseCardLoading from "./Cards/CourseCardLoading";
import CourseCardWithContent from "./Cards/CourseCardWithContent";

const CoursesList = () => {
    const coursesQuery = useQuery(coursesQueries.list());
    const isTeacher = useUserIsTeacher();

    if (coursesQuery.isError) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Не удалось загрузить курсы"
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (coursesQuery.data === undefined) {
        return (
            <div className="row justify-content-center">
                {Array.from(Array(12)).map((_, i) => (
                    <CourseCardLoading key={i} />
                ))}
            </div>
        );
    }

    const courses = coursesQuery.data.items;

    if (!isTeacher && courses.length === 0) {
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
            {courses.map((course) => {
                return <CourseCardWithContent key={course.id} course={course} />;
            })}
        </div>
    );
};

export default CoursesList;
