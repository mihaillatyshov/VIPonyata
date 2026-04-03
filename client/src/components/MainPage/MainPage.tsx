import { Link } from "react-router-dom";

import PageTitle from "components/Common/PageTitle";
import CoursesList from "components/Courses/CoursesList";
import { useUserIsTeacher } from "redux/funcs/user";

import styles from "components/Common/StyleCommon.module.css";

const MainPage = () => {
    const isTeacher = useUserIsTeacher();

    return (
        <div className="container">
            <PageTitle
                title="コース"
                rightElement={
                    isTeacher ? (
                        <Link to="/courses/create" className={styles.pageTitleAdd}>
                            <i className="bi bi-plus-lg" />
                        </Link>
                    ) : undefined
                }
            />
            <CoursesList />
        </div>
    );
};

export default MainPage;
