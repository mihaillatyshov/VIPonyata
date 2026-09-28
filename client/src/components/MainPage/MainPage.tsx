import { useCallback } from "react";
import { Link } from "react-router-dom";

import { coursesKeys, coursesQueries } from "api/courses";
import PageTitle from "components/Common/PageTitle";
import CoursesList from "components/Courses/CoursesList";
import { useUserIsTeacher } from "libs/user";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import AssignmentsHub from "./AssignmentsHub";

import styles from "components/Common/StyleCommon.module.css";

const MainPage = () => {
    const isTeacher = useUserIsTeacher();
    const queryClient = useQueryClient();
    // Сводка незавершённых уроков приходит вместе со списком курсов (тот же запрос, что и в `CoursesList`).
    const unfinishedLessonsSummary = useQuery(coursesQueries.list()).data?.unfinished_lessons;

    const refreshUnfinishedSummary = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: coursesKeys.list() });
    }, [queryClient]);

    return (
        <div className="container">
            {!isTeacher ? (
                <AssignmentsHub
                    unfinishedSummary={unfinishedLessonsSummary}
                    onUnfinishedChanged={refreshUnfinishedSummary}
                />
            ) : null}
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
