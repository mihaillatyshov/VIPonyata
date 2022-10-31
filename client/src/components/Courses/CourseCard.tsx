import React from "react";
import { Link } from "react-router-dom";
import style from "./StyleCourses.module.css";

type CourseCardProps = {
    course: any;
};

const CourseCard = ({ course }: CourseCardProps) => {
    return (
        <Link to={`/courses/${course.Id}`} className={"col-auto a-link " + style.linkCourse}>
            <div className={style.cardCourse}>
                {false && <img src="" alt="" />}
                <div>
                    <div> {course.Name} </div>
                    <div className="mb-2 text-muted"> {course.Difficulty} </div>
                    <div> {course.Description} </div>
                </div>
            </div>
        </Link>
    );
};

export default CourseCard;
