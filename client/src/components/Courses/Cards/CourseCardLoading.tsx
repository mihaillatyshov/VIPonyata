import React from "react";

import { DescriptionPlaceholder, DifficultyPlaceholder, TitlePlaceholder } from "./BaseParts/CourseCard";
import CourseCardBase from "./CourseCardBase";

import styles from "../StyleCourses.module.css";

const CourseCardLoading = () => {
    // TODO: Add img ???
    return (
        <div className={"col-auto a-link " + styles.linkCourse}>
            <CourseCardBase>
                <TitlePlaceholder />
                <DifficultyPlaceholder />
                <DescriptionPlaceholder />
            </CourseCardBase>
        </div>
    );
};

export default CourseCardLoading;