import React from "react";
import { Link } from "react-router-dom";

import { useUserIsTeacher } from "redux/funcs/user";
import CourseCardBase from "./CourseCardBase";

import styles from "../StyleCourses.module.css";

const CourseCardCreate = () => {
    const isTeacher = useUserIsTeacher();

    if (!isTeacher) {
        return null;
    }

    return (
        <Link to="/courses/create" className={"col-auto a-link " + styles.linkCourse}>
            <CourseCardBase>
                <div className="d-flex justify-content-center align-items-center h-100">
                    <i className="bi bi-plus-lg" style={{ fontSize: "128px" }} />
                </div>
            </CourseCardBase>
        </Link>
    );
};

export default CourseCardCreate;
