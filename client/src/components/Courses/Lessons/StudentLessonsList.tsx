import React from "react";
import { useAppSelector } from "redux/hooks";
import { selectLessons } from "redux/slices/lessonsSlice";
import LessonCard from "./LessonCard";

const StudentLessonsList = () => {
    const lessons = useAppSelector(selectLessons);

    return (
        <>
            {lessons.items === undefined ? (
                <div> Loading... </div>
            ) : lessons.items.length > 0 ? (
                <>
                    {lessons.items.map((lesson) => {
                        return <LessonCard lesson={lesson} key={lesson.Id} />;
                    })}
                </>
            ) : (
                <div>No Items</div>
            )}
        </>
    );
};

export default StudentLessonsList;
