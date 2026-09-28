import { useEffect, useReducer, useState } from "react";
import { useNavigate } from "react-router-dom";

import { reviewQueries, TReviewCatalog } from "api/review";
import Loading from "components/Common/Loading";
import ErrorPage from "components/ErrorPages/ErrorPage";
import ReviewTrainingHistory from "components/Review/ReviewTrainingHistory";

import { useQuery } from "@tanstack/react-query";

import ReviewFlashcardSession from "./ReviewFlashcardSession";
import { ReviewDictionariesPage, ReviewDictionaryPage, ReviewTopicPage } from "./ReviewLibraryPages";
import { REVIEW_ROUTE_PATHS, ReviewRoute, useReviewRoute } from "./reviewRoutes";
import { initialReviewSetupState, reviewSetupReducer } from "./reviewSetupReducer";
import ReviewStatusesPanel from "./ReviewStatusesPanel";
import { formatSessionStartDateTime, getReviewTrainingModeLabel } from "./reviewTraining";
import ReviewTrainingResults from "./ReviewTrainingResults";
import ReviewTrainingSetup from "./ReviewTrainingSetup";
import { ReviewTrainingState, useReviewTraining } from "./useReviewTraining";

import "components/Quizlet/FlashcardExercise.css";
import "components/Quizlet/QuizletSessionResults.css";
import "components/Quizlet/QuizletShared.css";
import "./TeacherReview.css";

const MODE_TABS: Array<{ kind: ReviewRoute["kind"]; label: string; path: string }> = [
    { kind: "root", label: "Словари", path: REVIEW_ROUTE_PATHS.root },
    { kind: "training", label: "Тренировка", path: REVIEW_ROUTE_PATHS.training },
    { kind: "history", label: "История", path: REVIEW_ROUTE_PATHS.history },
    { kind: "statuses", label: "Статусы", path: REVIEW_ROUTE_PATHS.statuses },
];

const ReviewModeTabs = ({ activeKind }: { activeKind: ReviewRoute["kind"] }) => {
    const navigate = useNavigate();

    return (
        <div className="review-mode-tabs-row">
            <div className="quizlet-student-dictionary-tabs" role="tablist" aria-label="Переключение режимов review">
                {MODE_TABS.map((tab) => (
                    <button
                        key={tab.kind}
                        type="button"
                        role="tab"
                        aria-selected={activeKind === tab.kind}
                        className={`btn quizlet-student-dictionary-tab ${activeKind === tab.kind ? "active" : ""}`}
                        onClick={() => navigate(tab.path)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

const ReviewResumeBanner = ({ training, catalog }: { training: ReviewTrainingState; catalog: TReviewCatalog }) => {
    const saved = training.savedTrainingSession;

    if (training.trainingSession !== null) {
        return null;
    }

    if (saved === null || saved.isFinished) {
        return training.hasSavedTrainingSessionError ? (
            <div className="review-library-container review-resume-banner">
                <div className="alert alert-warning mb-0">Не удалось восстановить незавершенное повторение</div>
            </div>
        ) : null;
    }

    const topicTitleById = new Map(catalog.topics.map((topic) => [topic.id, topic.title]));
    const topicTitles = saved.topicIds
        .map((topicId) => topicTitleById.get(topicId))
        .filter((title): title is string => Boolean(title));

    return (
        <>
            <div className="review-library-container review-resume-banner">
                <div className="alert alert-warning d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2 mb-0">
                    <div>
                        <div className="fw-semibold mb-1">Есть незавершенное повторение</div>
                        <div className="small">
                            Тип: {getReviewTrainingModeLabel(saved.mode)} • Прогресс: {saved.openedWordIds.length}/
                            {saved.initialWordIds.length}
                        </div>
                        <div className="small">Начало: {formatSessionStartDateTime(saved.startedAt)}</div>
                        {topicTitles.length > 0 && <div className="small">Темы: {topicTitles.join(", ")}</div>}
                    </div>
                    <div className="d-flex gap-2">
                        <button type="button" className="btn btn-warning" onClick={training.continueSavedTraining}>
                            Продолжить
                        </button>
                        <button type="button" className="btn btn-outline-danger" onClick={training.finishSavedTraining}>
                            Завершить
                        </button>
                    </div>
                </div>
            </div>
            {training.hasSavedTrainingSessionError && (
                <div className="review-library-container review-resume-banner">
                    <div className="alert alert-warning mb-0">Не удалось восстановить незавершенное повторение</div>
                </div>
            )}
        </>
    );
};

const TeacherReviewContent = ({ catalog }: { catalog: TReviewCatalog }) => {
    const navigate = useNavigate();
    const { pathname, route } = useReviewRoute();
    const [setup, dispatchSetup] = useReducer(reviewSetupReducer, initialReviewSetupState);
    const [expandedHistoryEntryId, setExpandedHistoryEntryId] = useState<string | null>(null);
    const training = useReviewTraining(catalog, setup);
    const { trainingSession, currentWord } = training;

    const isSessionRoute = route.kind === "flashcards" || route.kind === "results";

    // Страница соответствует тренировке: идёт — карточки, завершена — результаты, нет — выбор топиков.
    useEffect(() => {
        if (trainingSession !== null) {
            const targetPath = trainingSession.isFinished ? REVIEW_ROUTE_PATHS.results : REVIEW_ROUTE_PATHS.flashcards;
            if (pathname !== targetPath) {
                navigate(targetPath, { replace: true });
            }
            return;
        }

        if (isSessionRoute) {
            navigate(REVIEW_ROUTE_PATHS.training, { replace: true });
        }
    }, [trainingSession, pathname, isSessionRoute, navigate]);

    const resetTraining = () => {
        training.resetTraining();
        navigate(REVIEW_ROUTE_PATHS.training);
    };

    const renderLibrary = () => {
        if (route.kind === "root") {
            return <ReviewDictionariesPage catalog={catalog} />;
        }

        if (route.kind === "dictionary") {
            const dictionary = catalog.dictionaries.find((item) => item.id === route.dictionaryId);
            return dictionary ? (
                <ReviewDictionaryPage key={dictionary.id} catalog={catalog} dictionary={dictionary} />
            ) : null;
        }

        if (route.kind === "topic") {
            const topic = catalog.topics.find((item) => item.id === route.topicId);
            return topic ? <ReviewTopicPage key={topic.id} catalog={catalog} topic={topic} /> : null;
        }

        return null;
    };

    // Каждый ответ меняет ключ — карточка перемонтируется и снова показывает лицевую сторону.
    const answersCount =
        trainingSession === null
            ? 0
            : Object.values(trainingSession.assessments).reduce(
                  (total, assessment) => total + assessment.forgot + assessment.partial + assessment.remember,
                  0,
              );

    return (
        <div className="container review-page">
            {!isSessionRoute && <ReviewModeTabs activeKind={route.kind} />}
            {!isSessionRoute && <ReviewResumeBanner training={training} catalog={catalog} />}

            {renderLibrary()}

            {(route.kind === "training" || route.kind === "history" || route.kind === "statuses") && (
                <div className="review-section-card review-library-container">
                    <div className="review-training-setup">
                        {route.kind === "training" && (
                            <ReviewTrainingSetup
                                catalog={catalog}
                                setup={setup}
                                dispatch={dispatchSetup}
                                memoryStateError={training.memoryStateError}
                                onStart={training.startConfiguredTraining}
                            />
                        )}

                        {route.kind === "history" && (
                            <section className="review-training-panel">
                                <ReviewTrainingHistory
                                    entries={training.trainingHistory}
                                    expandedEntryId={expandedHistoryEntryId}
                                    hasStorageError={training.hasTrainingHistoryError}
                                    onRowClick={(entryId) =>
                                        setExpandedHistoryEntryId((prev) => (prev === entryId ? null : entryId))
                                    }
                                />
                            </section>
                        )}

                        {route.kind === "statuses" && <ReviewStatusesPanel words={catalog.words} />}
                    </div>
                </div>
            )}

            {route.kind === "flashcards" &&
                trainingSession !== null &&
                !trainingSession.isFinished &&
                currentWord !== null && (
                    <ReviewFlashcardSession
                        key={`${trainingSession.startedAt}:${answersCount}`}
                        session={trainingSession}
                        word={currentWord}
                        speakJpAfterFlip={setup.speakJpAfterFlip}
                        autoSpeakCards={setup.autoSpeakCards}
                        isUpdatingFrozen={training.isUpdatingWordMemoryState}
                        onReveal={training.revealCurrentWord}
                        onAnswer={training.answerCurrentWord}
                        onFinish={training.finishCurrentTraining}
                        onToggleFrozen={training.toggleCurrentWordFrozen}
                    />
                )}

            {route.kind === "results" && trainingSession !== null && trainingSession.isFinished && (
                <ReviewTrainingResults
                    session={trainingSession}
                    memoryStateError={training.memoryStateError}
                    onRepeatForgotten={training.repeatForgotten}
                    onRepeatAll={training.repeatAll}
                    onReset={resetTraining}
                />
            )}
        </div>
    );
};

const TeacherReview = () => {
    const catalogQuery = useQuery(reviewQueries.catalog());

    if (catalogQuery.isError) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Не удалось загрузить раздел 復習"
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (catalogQuery.isPending) {
        return <Loading />;
    }

    return <TeacherReviewContent catalog={catalogQuery.data} />;
};

export default TeacherReview;
