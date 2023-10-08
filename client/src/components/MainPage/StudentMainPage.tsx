import React from "react";

import PageTitle from "components/Common/PageTitle";
import CoursesList from "components/Courses/CoursesList";

const StudentMainPage = () => {
    return (
        <div className="container">
            <PageTitle title="コース" />
            <CoursesList />
        </div>
    );
};

export default StudentMainPage;
