import React from "react";

import { DescriptionPlaceholder, TitlePlaceholder } from "./BaseParts/LessonCard";
import LessonCardBase from "./LessonCardBase";

import styles from "../StyleLessons.module.css";
import LessonCardSkill from "./LessonCardSkill";
import { Link } from "react-router-dom";

const LessonCardLoading = () => {
    // TODO: Add img ???
    return (
        <LessonCardBase>
            <Link to="" className={"col a-link " + styles.linkLesson}>
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
