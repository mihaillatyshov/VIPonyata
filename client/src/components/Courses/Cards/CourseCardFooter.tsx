import React from "react";

import { useUserIsTeacher } from "redux/funcs/user";

const FONT_SIZE = "32px";

const CourseCardFooter = () => {
    const isTeacher = useUserIsTeacher();

    if (!isTeacher) {
        return null;
    }

    return (
        <div className="mt-auto d-flex justify-content-around">
            <i className="bi bi-pencil-square" style={{ fontSize: FONT_SIZE }} />
            <i className="bi bi-reply" style={{ fontSize: FONT_SIZE }} />
            <i className="bi bi-graph-up" style={{ fontSize: FONT_SIZE }} />
        </div>
    );
};

export default CourseCardFooter;
