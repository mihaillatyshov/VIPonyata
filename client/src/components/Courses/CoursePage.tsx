import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import PageTitle from "components/Common/PageTitle";
import UnfinishedLessonsCard from "components/Common/UnfinishedLessonsCard";
import LessonsList from "components/Lessons/LessonsList";
import { AjaxGet } from "libs/ServerAPI";
import { TCourse } from "models/TCourse";
import { TLesson, TUnfinishedLessonsSummary } from "models/TLesson";
import { useUserIsTeacher } from "redux/funcs/user";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { selectCourses, setSelectedCourse } from "redux/slices/coursesSlice";
import { selectLessons, setLessons, setUnfinishedLessonsSummary } from "redux/slices/lessonsSlice";

import styles from "components/Common/StyleCommon.module.css";

type ResponseData = {
    course: TCourse;
    items: TLesson[];
    unfinished_lessons?: TUnfinishedLessonsSummary;
};

const CoursePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const course = useAppSelector(selectCourses).selected;
    const unfinishedLessonsSummary = useAppSelector(selectLessons).unfinishedLessonsSummary;
    const isTeacher = useUserIsTeacher();

    const loadCourseData = () => {
        AjaxGet<ResponseData>({ url: `/api/courses/${id}` })
            .then((json) => {
                dispatch(setSelectedCourse(json.course));
                dispatch(setLessons(json.items));
                dispatch(setUnfinishedLessonsSummary(json.unfinished_lessons));
            })
            .catch(({ isServerError, response }) => {
                if (!isServerError) {
                    if (response.status === 404 || response.status === 403) navigate("/", { replace: true });
                }
            });
    };

    useEffect(() => {
        dispatch(setSelectedCourse(undefined));
        dispatch(setLessons(undefined));
        dispatch(setUnfinishedLessonsSummary(undefined));
        loadCourseData();
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
            <UnfinishedLessonsCard summary={unfinishedLessonsSummary} onChanged={loadCourseData} />
            <LessonsList />
        </div>
    );
};

export default CoursePage;
