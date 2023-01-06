import React from "react";
import { Link } from "react-router-dom";
import style from "./StyleCourses.module.css";

type CourseCardProps = {
    course: any;
};

const CourseCard = ({ course }: CourseCardProps) => {
    return (
        <Link to={`/courses/${course.id}`} className={"col-auto a-link " + style.linkCourse}>
            <div className={style.cardCourse}>
                {false && <img src="" alt="" />}
                <div>
                    <div> {course.name} </div>
                    <div className="mb-2 text-muted"> {course.difficulty} </div>
                    <div> {course.description} </div>
                </div>
            </div>
        </Link>
    );
};

export default CourseCard;
