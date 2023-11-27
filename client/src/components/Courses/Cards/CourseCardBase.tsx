import React from "react";

type CourseCardBaseProps = {
    children: React.ReactNode;
};

const CourseCardBase = ({ children }: CourseCardBaseProps) => {
    // TODO: Add img ???
    return (
        <div className="course__card">
            <div className="d-flex flex-column h-100 position-relative">{children}</div>
        </div>
    );
};

export default CourseCardBase;
