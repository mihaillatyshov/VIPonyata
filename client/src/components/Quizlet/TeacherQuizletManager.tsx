import { useNavigate } from "react-router-dom";

import { quizletQueries, TQuizletCatalog } from "api/quizlet";
import Loading from "components/Common/Loading";
import ErrorPage from "components/ErrorPages/ErrorPage";

import { useQuery } from "@tanstack/react-query";

import TeacherAssignmentCreatePage from "./Teacher/TeacherAssignmentCreatePage";
import TeacherAssignmentsListPage from "./Teacher/TeacherAssignmentsListPage";
import {
    TeacherLessonPage,
    TeacherLessonsPage,
    TeacherNotFound,
    TeacherTopicPage,
} from "./Teacher/TeacherCatalogPages";
import { teacherQuizletPaths, TeacherQuizletView, useTeacherQuizletView } from "./Teacher/useTeacherQuizletView";
import TeacherStudentDictionariesPage from "./TeacherStudentDictionariesPage";

import "./QuizletShared.css";

const TABS: Array<{ label: string; path: string; isActive: (view: TeacherQuizletView) => boolean }> = [
    {
        label: "📜 Словари",
        path: teacherQuizletPaths.lessons,
        isActive: (view) => view.kind === "lessons" || view.kind === "lesson" || view.kind === "topic",
    },
    {
        label: "🍶 Словари учеников",
        path: teacherQuizletPaths.studentsDictionaries,
        isActive: (view) => view.kind === "students-dictionaries",
    },
    {
        label: "🍱 Задания",
        path: teacherQuizletPaths.assignmentsCreate,
        isActive: (view) => view.kind === "assignments-create",
    },
    {
        label: "📑 Назначенное",
        path: teacherQuizletPaths.assignmentsList,
        isActive: (view) => view.kind === "assignments-list",
    },
];

const CatalogView = ({ view, catalog }: { view: TeacherQuizletView; catalog: TQuizletCatalog }) => {
    switch (view.kind) {
        case "lessons":
            return <TeacherLessonsPage catalog={catalog} />;
        case "lesson": {
            const group = catalog.groups.find((item) => item.id === view.lessonId);
            return group ? (
                <TeacherLessonPage catalog={catalog} group={group} />
            ) : (
                <TeacherNotFound title="Lesson not found" text="The selected lesson does not exist." />
            );
        }
        case "topic": {
            const subgroup = catalog.subgroups.find((item) => item.id === view.topicId);
            const group = catalog.groups.find((item) => item.id === subgroup?.group_id);
            return subgroup && group ? (
                <TeacherTopicPage catalog={catalog} group={group} subgroup={subgroup} />
            ) : (
                <TeacherNotFound title="Topic not found" text="The selected topic does not exist." />
            );
        }
        case "assignments-create":
            return <TeacherAssignmentCreatePage catalog={catalog} />;
        default:
            return null;
    }
};

const TeacherQuizletManager = () => {
    const navigate = useNavigate();
    const view = useTeacherQuizletView();
    const needsCatalog = view.kind !== "students-dictionaries" && view.kind !== "assignments-list";
    const catalogQuery = useQuery({ ...quizletQueries.catalog(), enabled: needsCatalog });

    if (needsCatalog && catalogQuery.isError) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Не удалось загрузить Quizlet manager"
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    return (
        <div className="container">
            <div className="quizlet-personal-dictionary-page" style={{ maxWidth: "760px", margin: "0 auto" }}>
                <div className="d-flex gap-2 mb-3">
                    {TABS.map((tab) => (
                        <button
                            key={tab.path}
                            className={`btn btn-sm ${tab.isActive(view) ? "btn-primary" : "btn-outline-secondary"}`}
                            onClick={() => navigate(tab.path)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {view.kind === "students-dictionaries" && (
                    <TeacherStudentDictionariesPage selectedStudentId={view.studentId} selectedTopicId={view.topicId} />
                )}

                {view.kind === "assignments-list" && <TeacherAssignmentsListPage />}

                {needsCatalog &&
                    (catalogQuery.data === undefined ? (
                        <Loading />
                    ) : (
                        <CatalogView view={view} catalog={catalogQuery.data} />
                    ))}
            </div>
        </div>
    );
};

export default TeacherQuizletManager;
