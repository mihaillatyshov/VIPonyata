import React from "react";

import { Link } from "react-router-dom";

import styles from "../StyleLessons.module.css";
import { DescriptionPlaceholder, TitlePlaceholder } from "./BaseParts/LessonCard";
import LessonCardBase from "./LessonCardBase";
import LessonCardSkill from "./LessonCardSkill";

const LessonCardLoading = () => {
    return (
        <LessonCardBase>
            <Link to="" className={"col a-link box-shadow-main " + styles.linkLesson}>
                <div className={`d-flex flex-column h-100 ${styles.cardLesson}`}>
                    <TitlePlaceholder />
                    <DescriptionPlaceholder />
                </div>
            </Link>
            <LessonCardSkill />
        </LessonCardBase>
    );
};

export default LessonCardLoading;
