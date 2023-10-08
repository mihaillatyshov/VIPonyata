import React from "react";

import styles from "../StyleCourses.module.css";

type CourseCardBaseProps = {
    children: React.ReactNode;
};

const CourseCardBase = ({ children }: CourseCardBaseProps) => {
    // TODO: Add img ???
    return (
        <div className={`${styles.cardCourse} box-shadow-main`}>
            <div className="d-flex flex-column h-100">{children}</div>
        </div>
    );
};

export default CourseCardBase;
