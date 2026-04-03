import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import PageDescription from "components/Common/PageDescription";
import PageTitle from "components/Common/PageTitle";
import LessonsList from "components/Lessons/LessonsList";
import { AjaxGet } from "libs/ServerAPI";
import { TCourse } from "models/TCourse";
import { TLesson } from "models/TLesson";
import { useUserIsTeacher } from "redux/funcs/user";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { selectCourses, setSelectedCourse } from "redux/slices/coursesSlice";
import { setLessons } from "redux/slices/lessonsSlice";

import styles from "components/Common/StyleCommon.module.css";

type ResponseData = {
    course: TCourse;
    items: TLesson[];
};

const CoursePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const course = useAppSelector(selectCourses).selected;
    const isTeacher = useUserIsTeacher();

    useEffect(() => {
        dispatch(setSelectedCourse(undefined));
        dispatch(setLessons(undefined));
        AjaxGet<ResponseData>({ url: `/api/courses/${id}` })
            .then((json) => {
                dispatch(setSelectedCourse(json.course));
                dispatch(setLessons(json.items));
            })
            .catch(({ isServerError, json, response }) => {
                if (!isServerError) {
                    if (response.status === 404 || response.status === 403) navigate("/", { replace: true });
                }
            });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="container" style={{ maxWidth: "640px" }}>
            <PageTitle
                title={course?.name}
                urlBack="/"
                rightElement={
                    isTeacher ? (
                        <Link to={`/lessons/create/${id}`} className={styles.pageTitleAdd}>
                            <i className="bi bi-plus-lg" />
                        </Link>
                    ) : undefined
                }
            />
            <PageDescription className="mb-5" description={course?.description} isCentered={true} />
            <LessonsList />
        </div>
    );
};

export default CoursePage;
