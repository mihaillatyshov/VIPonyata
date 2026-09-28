import { Link, useParams } from "react-router-dom";

import { coursesKeys, coursesQueries } from "api/courses";
import PageTitle from "components/Common/PageTitle";
import UnfinishedLessonsCard from "components/Common/UnfinishedLessonsCard";
import LessonsList from "components/Lessons/LessonsList";
import { useUserIsTeacher } from "libs/user";
import { useRedirectOnApiError } from "libs/useRedirectOnApiError";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import styles from "components/Common/StyleCommon.module.css";

const CoursePage = () => {
    const { id = "" } = useParams();
    const queryClient = useQueryClient();
    const courseQuery = useQuery(coursesQueries.detail(id));
    const isTeacher = useUserIsTeacher();

    useRedirectOnApiError(courseQuery.error, (status) => (status === 404 || status === 403 ? "/" : null));

    const course = courseQuery.data?.course;

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
            <UnfinishedLessonsCard
                summary={courseQuery.data?.unfinished_lessons}
                onChanged={() => queryClient.invalidateQueries({ queryKey: coursesKeys.detail(id) })}
            />
            <LessonsList lessons={courseQuery.data?.items} />
        </div>
    );
};

export default CoursePage;
