import React from "react";
import { useUserIsTeacher } from "redux/funcs/user";

const LessonCardFooter = () => {
    const isTeacher = useUserIsTeacher();

    if (!isTeacher) {
        return null;
    }

    return (
        <div className="mt-auto d-flex justify-content-around">
            <i className="bi bi-pencil-square" style={{ fontSize: "24px" }} />
            <i className="bi bi-reply" style={{ fontSize: "24px" }} />
            <i className="bi bi-graph-up" style={{ fontSize: "24px" }} />
        </div>
    );
};

export default LessonCardFooter;
