import { Link } from "react-router-dom";

import PageTitle from "components/Common/PageTitle";
import CoursesList from "components/Courses/CoursesList";

const MainPage = () => {
    return (
        <div className="container">
            <PageTitle title="コース" />
            <div className="mb-3">
                <Link to="/quizlet" className="btn btn-outline-primary">
                    Перейти в Quizlet
                </Link>
            </div>
            <CoursesList />
        </div>
    );
};

export default MainPage;
