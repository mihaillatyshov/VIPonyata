import React from "react";

type LessonCardBaseProps = {
    children: React.ReactNode;
};

const LessonCardBase = ({ children }: LessonCardBaseProps) => {
    // TODO: Add img ???
    return <div className="row justify-content-center">{children}</div>;
};

export default LessonCardBase;
