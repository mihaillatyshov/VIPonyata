import ErrorPage from "components/ErrorPages/ErrorPage";
import { useUserIsTeacher } from "libs/user";
import { TLesson } from "models/TLesson";

import LessonCardLoading from "./Cards/LessonCardLoading";
import LessonCardWithContent from "./Cards/LessonCardWithContent";

interface LessonsListProps {
    /** `undefined` — уроки ещё загружаются. */
    lessons: TLesson[] | undefined;
}

const LessonsList = ({ lessons }: LessonsListProps) => {
    const isTeacher = useUserIsTeacher();

    if (lessons === undefined) {
        return (
            <div className="">
                {Array.from(Array(12)).map((_, i) => (
                    <LessonCardLoading key={i} />
                ))}
            </div>
        );
    }

    if (!isTeacher && lessons.length === 0) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Нет доступных уроков"
                textDisabled="Попросите Машу открыть вам доступ к урокам :3"
                needReload={false}
            />
        );
    }

    return (
        <div className="">
            {lessons.map((lesson) => {
                return <LessonCardWithContent key={lesson.id} lesson={lesson} />;
            })}
            {isTeacher && lessons.length === 0 && (
                <ErrorPage errorImg="/svg/SomethingWrong.svg" textMain="Нет созданных уроков" needReload={false} />
            )}
        </div>
    );
};

export default LessonsList;
