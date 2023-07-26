import React from "react";

import styles from "../StyleLessons.module.css";

type LessonCardBaseProps = {
    children: React.ReactNode;
};

const LessonCardBase = ({ children }: LessonCardBaseProps) => {
    // TODO: Add img ???
    return <div className={`row justify-content-center mx-0 px-0 ${styles.lessonCardBase}`}>{children}</div>;
};

export default LessonCardBase;
