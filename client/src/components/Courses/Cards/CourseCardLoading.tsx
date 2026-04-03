import styles from "../StyleCourses.module.css";
import { DescriptionPlaceholder, TitlePlaceholder } from "./BaseParts/CourseCard";
import CourseCardBase from "./CourseCardBase";

const CourseCardLoading = () => {
    // TODO: Add img ???
    return (
        <div className={"col-auto a-link " + styles.linkCourse}>
            <CourseCardBase>
                <TitlePlaceholder />
                <DescriptionPlaceholder />
            </CourseCardBase>
        </div>
    );
};

export default CourseCardLoading;
