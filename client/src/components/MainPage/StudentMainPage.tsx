import React from "react";
import CoursesList from "components/Courses/CoursesList";
import PageTitle from "components/Common/PageTitle";

const StudentMainPage = () => {
    return (
        <div className="container">
            <PageTitle title="Мои путешествия" />
            <CoursesList />
            {
                //<div className="mt-4">
                //    MOVE IT IN PROFILE!!!
                //    <Link to="/upload"> Upload </Link>
                //    <Button type="button" onClick={handleLogout}>
                //        Logout
                //    </Button>
                //</div>
            }
        </div>
    );
};

export default StudentMainPage;
