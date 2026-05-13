import { useCallback, useState } from "react";
import { Link } from "react-router-dom";

import PageTitle from "components/Common/PageTitle";
import CoursesList from "components/Courses/CoursesList";
import { AjaxGet } from "libs/ServerAPI";
import { TUnfinishedLessonsSummary } from "models/TLesson";
import { useNotificationsHubSync } from "redux/funcs/notificationsHub";
import { useUserIsTeacher } from "redux/funcs/user";

import styles from "components/Common/StyleCommon.module.css";

import AssignmentsHub from "./AssignmentsHub";

const MainPage = () => {
    const isTeacher = useUserIsTeacher();
    const [unfinishedLessonsSummary, setUnfinishedLessonsSummary] = useState<TUnfinishedLessonsSummary | undefined>(
        undefined,
    );

    useNotificationsHubSync();

    const refreshUnfinishedSummary = useCallback(() => {
        AjaxGet<{ unfinished_lessons?: TUnfinishedLessonsSummary; items: unknown[] }>({ url: "/api/courses" }).then(
            (json) => {
                setUnfinishedLessonsSummary(json.unfinished_lessons);
            },
        );
    }, []);

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
            <CoursesList onLoaded={(data) => setUnfinishedLessonsSummary(data.unfinished_lessons)} />
        </div>
    );
};

export default MainPage;
