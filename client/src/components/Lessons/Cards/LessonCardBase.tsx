import React from "react";

type LessonCardBaseProps = {
    children: React.ReactNode;
};

const LessonCardBase = ({ children }: LessonCardBaseProps) => {
    return <div className={`row justify-content-center lesson__card`}>{children}</div>;
};

export default LessonCardBase;
