import React from "react";
import { useParams } from "react-router-dom";

const LessonCreatePage = () => {
    const { courseId } = useParams();

    return <div className="container">LessonCreatePage {courseId}</div>;
};

export default LessonCreatePage;
