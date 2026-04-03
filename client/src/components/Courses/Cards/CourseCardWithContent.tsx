import { Link } from "react-router-dom";

import { TCourse } from "models/TCourse";
import { useUserIsTeacher } from "redux/funcs/user";

import styles from "../StyleCourses.module.css";
import { Description, Title } from "./BaseParts/CourseCard";
import CourseCardBase from "./CourseCardBase";
import CourseCardFooter from "./CourseCardFooter";

type CourseCardWithContentProps = {
    course: TCourse;
};

const CourseCardWithContent = ({ course }: CourseCardWithContentProps) => {
    const isTeacher = useUserIsTeacher();

    return (
        <Link to={`/courses/${course.id}`} className={"col-auto a-link " + styles.linkCourse}>
            <CourseCardBase>
                {isTeacher && <div className="course__card-sort">{course.sort}</div>}
                <div className="course__card-text-block">
                    <Title title={course.name} />
                    <div className={`course__card-content-row ${course.img !== null ? "with-img" : ""}`}>
                        <div className="course__card-extra-text-block with-img">
                            <Description description={course.description} />
                        </div>
                        {course.img !== null ? <img src={course.img} alt="" className="course__card-img" /> : null}
                    </div>
                </div>
                <CourseCardFooter id={course.id} courseName={course.name} />
            </CourseCardBase>
        </Link>
    );
};

export default CourseCardWithContent;
