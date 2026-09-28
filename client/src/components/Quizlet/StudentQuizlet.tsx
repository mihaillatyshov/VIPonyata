import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { quizletQueries } from "api/quizlet";
import Loading from "components/Common/Loading";
import PageTitle from "components/Common/PageTitle";
import ErrorPage from "components/ErrorPages/ErrorPage";
import { useNotificationsHubSync } from "redux/funcs/notificationsHub";

import { useQuery } from "@tanstack/react-query";

import PersonalDictionaryPage from "./Student/PersonalDictionaryPage";
import QuizletTrainingSession from "./Student/QuizletTrainingSession";
import QuizletTrainingSetup from "./Student/QuizletTrainingSetup";
import StudentQuizletModeSelection from "./Student/StudentQuizletModeSelection";
import StudentQuizletProgress from "./Student/StudentQuizletProgress";
import { studentQuizletPaths, StudentQuizletRoute, useStudentQuizletRoute } from "./Student/studentQuizletRoutes";
import TeacherDictionariesView from "./Student/TeacherDictionariesView";
import { useQuizletSession } from "./Student/useQuizletSession";

import "./QuizletShared.css";

const PAGE_TITLES: Partial<Record<StudentQuizletRoute["kind"], string>> = {
    setup: "トレーニング",
    progress: "私の結果",
    flashcards: "フラッシュカード",
    results: "スコア",
    pairs: "ペア",
};

const getPageBackUrl = (route: StudentQuizletRoute) => {
    switch (route.kind) {
        case "setup":
        case "progress":
            return studentQuizletPaths.modeSelection;
        case "flashcards":
        case "pairs":
        case "results":
            return undefined;
        default:
            return "/";
    }
};

const AssignmentRunPanel = ({ error }: { error: string | null }) => {
    const navigate = useNavigate();

    return (
        <div className="mx-auto mt-5" style={{ maxWidth: "760px" }}>
            <div className="quizlet-main-container">
                {error === null ? (
                    <div className="text-muted">Подготовка задания...</div>
                ) : (
                    <>
                        <div className="text-danger mb-3">{error}</div>
                        <button
                            className="btn btn-outline-primary"
                            onClick={() => navigate(studentQuizletPaths.modeSelection)}
                        >
                            Назад к Quizlet
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const StudentQuizlet = () => {
    const { refreshHub } = useNotificationsHubSync();
    const navigate = useNavigate();
    const { pathname, route } = useStudentQuizletRoute();

    const catalogQuery = useQuery(quizletQueries.catalog());
    const personalQuery = useQuery(quizletQueries.personal());
    const quizletSession = useQuizletSession(() => refreshHub(true));
    const { session, closeSession } = quizletSession;

    // Страница тренировки соответствует состоянию сессии: идёт — карточки/пары, завершена — результаты.
    useEffect(() => {
        if (session !== null) {
            if (session.is_finished && route.kind === "mode-selection") {
                closeSession();
                return;
            }

            const targetPath = session.is_finished
                ? studentQuizletPaths.results
                : session.quiz_type === "flashcards"
                  ? studentQuizletPaths.flashcards
                  : studentQuizletPaths.pairs;

            if (pathname !== targetPath) {
                navigate(targetPath, { replace: true });
            }
            return;
        }

        if (route.kind === "flashcards" || route.kind === "pairs" || route.kind === "results") {
            navigate(studentQuizletPaths.setup, { replace: true });
        }
    }, [session, pathname, route.kind, navigate, closeSession]);

    // Открытие задания по ссылке /quizlet/assignments/:id — сразу начинаем (или продолжаем) его сессию.
    const assignmentId = route.kind === "assignment" ? route.assignmentId : null;
    const startedAssignmentIdRef = useRef<number | null>(null);
    const [assignmentError, setAssignmentError] = useState<{ assignmentId: number; message: string } | null>(null);

    const startAssignment = useEffectEvent((targetAssignmentId: number) => {
        if (session !== null && session.assignment_id === targetAssignmentId && !session.is_finished) {
            return;
        }

        quizletSession.startAssignmentSession(targetAssignmentId).then((message) => {
            setAssignmentError(message === null ? null : { assignmentId: targetAssignmentId, message });
        });
    });

    useEffect(() => {
        if (assignmentId === null) {
            startedAssignmentIdRef.current = null;
            return;
        }
        if (startedAssignmentIdRef.current === assignmentId) {
            return;
        }
        startedAssignmentIdRef.current = assignmentId;
        startAssignment(assignmentId);
    }, [assignmentId]);

    if (catalogQuery.isError || personalQuery.isError) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Не удалось загрузить Quizlet"
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (catalogQuery.isPending || personalQuery.isPending) {
        return <Loading />;
    }

    const catalog = catalogQuery.data;
    const personal = personalQuery.data;
    const isDictionaryRoute = route.kind === "view" || route.kind === "personal";

    const finishAndBackToStart = () => {
        closeSession();
        navigate(studentQuizletPaths.modeSelection);
    };

    const renderPage = () => {
        switch (route.kind) {
            case "mode-selection":
                return <StudentQuizletModeSelection />;
            case "setup":
                return (
                    <QuizletTrainingSetup
                        catalog={catalog}
                        personal={personal}
                        onStart={quizletSession.startSession}
                        onContinue={quizletSession.continueSession}
                        onHubChanged={() => refreshHub(true)}
                    />
                );
            case "view":
                return <TeacherDictionariesView catalog={catalog} lessonId={route.lessonId} topicId={route.topicId} />;
            case "personal":
                return (
                    <PersonalDictionaryPage
                        key={route.topicId ?? "root"}
                        dictionary={personal}
                        topicId={route.topicId}
                    />
                );
            case "progress":
                return <StudentQuizletProgress catalog={catalog} personal={personal} />;
            case "assignment":
                return (
                    <AssignmentRunPanel
                        error={assignmentError?.assignmentId === route.assignmentId ? assignmentError.message : null}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="container">
            {!isDictionaryRoute && (
                <PageTitle title={PAGE_TITLES[route.kind] ?? "ワードラボ"} urlBack={getPageBackUrl(route)} />
            )}

            {session === null ? (
                renderPage()
            ) : (
                <QuizletTrainingSession session={session} state={quizletSession} onFinish={finishAndBackToStart} />
            )}
        </div>
    );
};

export default StudentQuizlet;
