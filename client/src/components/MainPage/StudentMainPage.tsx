import React from "react";
import StudentCoursesList from "components/Courses/StudentCoursesList";
import style from "./StyleMainPage.module.css";

const StudentMainPage = () => {
    return (
        <div className="container">
            <div className="row">
                <div className={"col-auto " + style.mainTitle}>Мои путешествия</div>
            </div>
            <StudentCoursesList />
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
