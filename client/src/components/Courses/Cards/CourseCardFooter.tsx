import React from "react";

import { useUserIsTeacher } from "redux/funcs/user";

const CourseCardFooter = () => {
    const isTeacher = useUserIsTeacher();

    if (!isTeacher) {
        return null;
    }

    return (
        <div className="mt-auto d-flex justify-content-around">
            <i className="bi bi-pencil-square" style={{ fontSize: "48px" }} />
            <i className="bi bi-reply" style={{ fontSize: "48px" }} />
            <i className="bi bi-graph-up" style={{ fontSize: "48px" }} />
        </div>
    );
};

export default CourseCardFooter;
