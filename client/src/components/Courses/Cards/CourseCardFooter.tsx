import React from "react";

import { useUserIsTeacher } from "redux/funcs/user";

const FONT_SIZE = "32px";

interface CourseCardFooterProps {
    id: number;
}

const CourseCardFooter = ({ id }:CourseCardFooterProps) => {
    const isTeacher = useUserIsTeacher();

    if (!isTeacher) {
        return null;
    }

    const onShareClick = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        console.log(`Share ${id}`);
    };

    return (
        <div className="mt-auto d-flex justify-content-around">
            <i className="bi bi-pencil-square" style={{ fontSize: FONT_SIZE }} />
            <i className="bi bi-reply font-icon-button" style={{ fontSize: FONT_SIZE }} onClick={onShareClick} />
            <i className="bi bi-graph-up" style={{ fontSize: FONT_SIZE }} />
        </div>
    );
};

export default CourseCardFooter;
