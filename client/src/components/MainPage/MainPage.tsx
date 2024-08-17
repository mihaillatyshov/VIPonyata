import React from "react";

import PageTitle from "components/Common/PageTitle";
import CoursesList from "components/Courses/CoursesList";

const MainPage = () => {
    return (
        <div className="container">
            <PageTitle className="ap-japanesefont" title="コース" />
            <CoursesList />
        </div>
    );
};

export default MainPage;
