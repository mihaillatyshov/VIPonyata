import React from "react";
import { useAppSelector } from "redux/hooks";
import { selectLessons } from "redux/slices/lessonsSlice";
import LessonCard from "./LessonCard";

const StudentLessonsList = () => {
    const lessons = useAppSelector(selectLessons);

    if (lessons.items === undefined) {
        return <div> Loading... </div>;
    }
    if (lessons.items.length === 0) {
        return <div>No Items</div>;
    }
    return (
        <>
            {lessons.items.map((lesson) => {
                return <LessonCard lesson={lesson} key={lesson.id} />;
            })}
        </>
    );
};

export default StudentLessonsList;
