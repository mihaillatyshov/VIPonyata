import React from "react";

import { TCourse } from "models/TCourse";
import { Link } from "react-router-dom";

import styles from "../StyleCourses.module.css";
import { Description, Difficulty, Title } from "./BaseParts/CourseCard";
import CourseCardBase from "./CourseCardBase";
import CourseCardFooter from "./CourseCardFooter";

type CourseCardWithContentProps = {
    course: TCourse;
};

const CourseCardWithContent = ({ course }: CourseCardWithContentProps) => {
    return (
        <Link to={`/courses/${course.id}`} className={"col-auto a-link " + styles.linkCourse}>
            <CourseCardBase>
                <div className="d-flex">
                    <div>
                        <Title title={course.name} />
                        <Difficulty difficulty={course.difficulty} />
                        <Description description={course.description} />
                    </div>
                    <div className="ms-auto">
                        {course.img !== null ? (
                            <img src={course.img} alt="" style={{ maxHeight: "200px", maxWidth: "120px" }} />
                        ) : null}
                    </div>
                </div>
                <CourseCardFooter />
            </CourseCardBase>
        </Link>
    );
};

export default CourseCardWithContent;
