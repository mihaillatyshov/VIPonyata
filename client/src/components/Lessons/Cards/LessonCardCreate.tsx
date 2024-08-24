import React from "react";
import { Link } from "react-router-dom";

import { useUserIsTeacher } from "redux/funcs/user";

import styles from "../StyleLessons.module.css";
import LessonCardBase from "./LessonCardBase";

interface LessonCardCreateProps {
    courseId: number;
}

const LessonCardCreate = ({ courseId }: LessonCardCreateProps) => {
    const isTeacher = useUserIsTeacher();

    if (!isTeacher) {
        return null;
    }

    return (
        <LessonCardBase>
            <Link to={`/lessons/create/${courseId}`} className={"col a-link box-shadow-main " + styles.linkLesson}>
                <div className={`d-flex flex-column h-100 ${styles.cardLesson}`}>
                    <div className="d-flex justify-content-center align-items-center h-100">
                        <i className="bi bi-plus-lg" style={{ fontSize: "80px" }} />
                    </div>
                </div>
            </Link>
        </LessonCardBase>
    );
};

export default LessonCardCreate;
