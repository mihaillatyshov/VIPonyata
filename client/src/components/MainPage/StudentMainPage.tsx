import React from "react";
import StudentCoursesBlock from "components/Courses/StudentCoursesList";
import style from "./StyleMainPage.module.css";

const StudentMainPage = () => {
    //const handleLogout = () => {
    //    ServerAPI_POST({
    //        url: "/api/logout",
    //        onDataReceived: (data) => {
    //            console.log(data);
    //            dispatch(setUserData({ isAuth: false, userData: {} }));
    //        },
    //    });
    //};

    return (
        <div className="container">
            <div className="row">
                <div className={"col-auto " + style.mainTitle}>Мои путешествия</div>
            </div>
            <StudentCoursesBlock />
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
