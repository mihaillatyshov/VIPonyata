import React from "react";
import { Link } from "react-router-dom";

import { TCourse } from "models/TCourse";
import { Description, Difficulty, Title } from "./BaseParts/CourseCard";
import CourseCardBase from "./CourseCardBase";
import CourseCardFooter from "./CourseCardFooter";

import styles from "../StyleCourses.module.css";

type CourseCardWithContentProps = {
    course: TCourse;
};

const CourseCardWithContent = ({ course }: CourseCardWithContentProps) => {
    // TODO: Add img ???
    return (
        <Link to={`/courses/${course.id}`} className={"col-auto a-link " + styles.linkCourse}>
            <CourseCardBase>
                <Title title={course.name} />
                <Difficulty difficulty={course.difficulty} />
                <Description description={course.description} />
                <CourseCardFooter />
            </CourseCardBase>
        </Link>
    );
};

export default CourseCardWithContent;
