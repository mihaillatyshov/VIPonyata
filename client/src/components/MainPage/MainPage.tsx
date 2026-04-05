import { useCallback, useState } from "react";
import { Link } from "react-router-dom";

import PageTitle from "components/Common/PageTitle";
import UnfinishedLessonsCard from "components/Common/UnfinishedLessonsCard";
import CoursesList from "components/Courses/CoursesList";
import { AjaxGet } from "libs/ServerAPI";
import { TUnfinishedLessonsSummary } from "models/TLesson";
import { useUserIsTeacher } from "redux/funcs/user";

import styles from "components/Common/StyleCommon.module.css";

const MainPage = () => {
    const isTeacher = useUserIsTeacher();
    const [unfinishedLessonsSummary, setUnfinishedLessonsSummary] = useState<TUnfinishedLessonsSummary | undefined>(
        undefined,
    );

    const refreshUnfinishedSummary = useCallback(() => {
        AjaxGet<{ unfinished_lessons?: TUnfinishedLessonsSummary; items: unknown[] }>({ url: "/api/courses" }).then(
            (json) => {
                setUnfinishedLessonsSummary(json.unfinished_lessons);
            },
        );
    }, []);

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
            <UnfinishedLessonsCard summary={unfinishedLessonsSummary} onChanged={refreshUnfinishedSummary} />
            <CoursesList onLoaded={(data) => setUnfinishedLessonsSummary(data.unfinished_lessons)} />
        </div>
    );
};

export default MainPage;
