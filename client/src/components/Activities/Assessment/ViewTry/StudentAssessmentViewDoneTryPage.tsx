import React, { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Loading from "components/Common/Loading";
import PageTitle from "components/Common/PageTitle";
import ErrorPage from "components/ErrorPages/ErrorPage";
import { AjaxGet, AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import {
    TAssessmentCheckedItemBase,
    TAssessmentItemBase,
    TAssessmentTaskName,
    TGetAssessmentCheckTypeByName,
    TGetAssessmentDoneTryTypeByName,
} from "models/Activity/Items/TAssessmentItems";
import { TAssessmentDoneTry } from "models/Activity/Try/TAssessmentTry";
import { TStudentNotification } from "models/TNotification";

import { AssessmentDoneTryTaskBaseProps } from "./Tasks/AssessmentDoneTryTaskBase";
import { StudentAssessmentDoneTryAudio } from "./Tasks/Student/StudentAssessmentDoneTryAudio";
import { StudentAssessmentDoneTryClassification } from "./Tasks/Student/StudentAssessmentDoneTryClassification";
import { StudentAssessmentDoneTryCreateSentence } from "./Tasks/Student/StudentAssessmentDoneTryCreateSentence";
import { StudentAssessmentDoneTryFillSpacesByHand } from "./Tasks/Student/StudentAssessmentDoneTryFillSpacesByHand";
import { StudentAssessmentDoneTryFillSpacesExists } from "./Tasks/Student/StudentAssessmentDoneTryFillSpacesExists";
import { StudentAssessmentDoneTryFindPair } from "./Tasks/Student/StudentAssessmentDoneTryFindPair";
import { StudentAssessmentDoneTryImg } from "./Tasks/Student/StudentAssessmentDoneTryImg";
import { StudentAssessmentDoneTryOpenQuestion } from "./Tasks/Student/StudentAssessmentDoneTryOpenQuestion";
import { StudentAssessmentDoneTrySentenceOrder } from "./Tasks/Student/StudentAssessmentDoneTrySentenceOrder";
import { StudentAssessmentDoneTryTestMulti } from "./Tasks/Student/StudentAssessmentDoneTryTestMulti";
import { StudentAssessmentDoneTryTestSingle } from "./Tasks/Student/StudentAssessmentDoneTryTestSingle";
import { StudentAssessmentDoneTryText } from "./Tasks/Student/StudentAssessmentDoneTryText";

type TAliasProp<T extends TAssessmentItemBase, K extends TAssessmentCheckedItemBase> = (
    props: AssessmentDoneTryTaskBaseProps<T, K>,
) => React.ReactElement;

type TAliases = {
    [key in TAssessmentTaskName]: TAliasProp<TGetAssessmentDoneTryTypeByName[key], TGetAssessmentCheckTypeByName[key]>;
};

const aliases: TAliases = {
    text: StudentAssessmentDoneTryText,
    test_single: StudentAssessmentDoneTryTestSingle,
    test_multi: StudentAssessmentDoneTryTestMulti,
    find_pair: StudentAssessmentDoneTryFindPair,
    create_sentence: StudentAssessmentDoneTryCreateSentence,
    fill_spaces_exists: StudentAssessmentDoneTryFillSpacesExists,
    fill_spaces_by_hand: StudentAssessmentDoneTryFillSpacesByHand,
    classification: StudentAssessmentDoneTryClassification,
    sentence_order: StudentAssessmentDoneTrySentenceOrder,
    open_question: StudentAssessmentDoneTryOpenQuestion,
    img: StudentAssessmentDoneTryImg,
    audio: StudentAssessmentDoneTryAudio,
    block_begin: () => <></>,
    block_end: () => <></>,
};

interface DoneTryResponse {
    done_try: TAssessmentDoneTry;
    lesson_id: number;
}

interface NotificationsResponse {
    notifications: TStudentNotification[];
}

interface TaskInBlock {
    doneTask: TAssessmentItemBase;
    checkedTask: TAssessmentCheckedItemBase;
    originalIndex: number;
}

interface TaskBlock {
    id: number;
    tasks: TaskInBlock[];
}

type TResultViewMode = "errors" | "all";

const StudentAssessmentViewDoneTryPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [doneTry, setDoneTry] = useState<LoadStatus.DataDoneOrNotDone<{ data: TAssessmentDoneTry }>>({
        loadStatus: LoadStatus.NONE,
    });
    const [lessonId, setLessonId] = useState<number>();
    const [viewMode, setViewMode] = useState<TResultViewMode | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetry = () => {
        setIsRetrying(true);
        AjaxPost({ url: `/api/assessment/${doneTry.data.base_id}/newtry` })
            .then(() => {
                navigate(`/assessment/${doneTry.data.base_id}`);
            })
            .catch(() => {
                setIsRetrying(false);
            });
    };

    useLayoutEffect(() => {
        setDoneTry({ loadStatus: LoadStatus.LOADING });
        AjaxGet<DoneTryResponse>({ url: `/api/assessment/donetries/${id}` })
            .then((json) => {
                setDoneTry({ loadStatus: LoadStatus.DONE, data: json.done_try });
                setLessonId(json.lesson_id);
            })
            .catch(() => {
                setDoneTry({ loadStatus: LoadStatus.ERROR });
            });
    }, [id]);

    useEffect(() => {
        const doneTryId = Number(id);
        if (Number.isNaN(doneTryId)) {
            return;
        }

        const markDoneTryNotificationsAsRead = () => {
            AjaxGet<NotificationsResponse>({ url: "/api/notifications" })
                .then((json) => {
                    const notificationIds = json.notifications
                        .filter(
                            (notification) =>
                                !notification.viewed &&
                                !notification.deleted &&
                                notification.type === "assessment_try" &&
                                notification.activity_try_id === doneTryId,
                        )
                        .map((notification) => notification.id);

                    if (notificationIds.length > 0) {
                        AjaxPost({ url: "/api/notifications/read", body: { notification_ids: notificationIds } });
                    }
                })
                .catch(() => {
                    return;
                });
        };

        markDoneTryNotificationsAsRead();
        const timerId = window.setInterval(markDoneTryNotificationsAsRead, 10000);

        return () => {
            window.clearInterval(timerId);
        };
    }, [id]);

    if (doneTry.loadStatus === LoadStatus.ERROR) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Не удалось загрузить данные"
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (doneTry.loadStatus !== LoadStatus.DONE) {
        return <Loading />;
    }

    const drawItem = <T extends TAssessmentItemBase, K extends TAssessmentCheckedItemBase>(
        doneTask: T,
        checkedTask: K,
        id: number,
    ) => {
        const component = aliases[doneTask.name] as any as TAliasProp<T, K>;
        return React.createElement(component, {
            data: doneTask,
            checks: checkedTask,
            taskId: id,
        });
    };

    const isDrawableItem = (task: TAssessmentItemBase) => {
        return task.name !== TAssessmentTaskName.BLOCK_BEGIN && task.name !== TAssessmentTaskName.BLOCK_END;
    };

    const createBlocks = (): TaskBlock[] => {
        const blocks: TaskBlock[] = [];
        let currentBlock: TaskBlock = { id: 1, tasks: [] };

        doneTry.data.done_tasks.forEach((doneTask, index) => {
            const checkedTask = doneTry.data.checked_tasks[index] as TAssessmentCheckedItemBase;

            if (doneTask.name === TAssessmentTaskName.BLOCK_BEGIN) {
                if (currentBlock.tasks.length > 0) {
                    blocks.push(currentBlock);
                }

                currentBlock = { id: blocks.length + 1, tasks: [] };
                return;
            }

            if (doneTask.name === TAssessmentTaskName.BLOCK_END) {
                if (currentBlock.tasks.length > 0) {
                    blocks.push(currentBlock);
                }

                currentBlock = { id: blocks.length + 1, tasks: [] };
                return;
            }

            currentBlock.tasks.push({
                doneTask,
                checkedTask,
                originalIndex: index,
            });
        });

        if (currentBlock.tasks.length > 0) {
            blocks.push(currentBlock);
        }

        return blocks;
    };

    const blocks = createBlocks();

    const isTaskWithErrors = (task: TaskInBlock): boolean => {
        return task.checkedTask.mistakes_count > 0;
    };

    const visibleBlocks =
        viewMode === "all"
            ? blocks
            : blocks
                  .map((block) => ({
                      ...block,
                      tasks: block.tasks.filter(isTaskWithErrors),
                  }))
                  .filter((block) => block.tasks.length > 0);

    const totalMistakesCount =
        typeof doneTry.data.mistakes_count === "number"
            ? doneTry.data.mistakes_count
            : doneTry.data.checked_tasks.reduce((acc, task) => acc + (Number(task?.mistakes_count) || 0), 0);

    const getTaskCorrectAnswersTotal = (task: TAssessmentItemBase): number => {
        switch (task.name) {
            case TAssessmentTaskName.TEST_SINGLE:
                return 1;
            case TAssessmentTaskName.TEST_MULTI:
                return (task as TGetAssessmentDoneTryTypeByName[TAssessmentTaskName.TEST_MULTI]).meta_answers.length;
            case TAssessmentTaskName.FIND_PAIR:
                return (task as TGetAssessmentDoneTryTypeByName[TAssessmentTaskName.FIND_PAIR]).meta_first.length;
            case TAssessmentTaskName.CREATE_SENTENCE:
                return (task as TGetAssessmentDoneTryTypeByName[TAssessmentTaskName.CREATE_SENTENCE]).meta_parts.length;
            case TAssessmentTaskName.FILL_SPACES_EXISTS:
                return (task as TGetAssessmentDoneTryTypeByName[TAssessmentTaskName.FILL_SPACES_EXISTS]).meta_answers
                    .length;
            case TAssessmentTaskName.FILL_SPACES_BY_HAND:
                return (task as TGetAssessmentDoneTryTypeByName[TAssessmentTaskName.FILL_SPACES_BY_HAND]).meta_answers
                    .length;
            case TAssessmentTaskName.CLASSIFICATION:
                return (
                    task as TGetAssessmentDoneTryTypeByName[TAssessmentTaskName.CLASSIFICATION]
                ).meta_answers.reduce((acc, col) => acc + col.length, 0);
            case TAssessmentTaskName.SENTENCE_ORDER:
                return (task as TGetAssessmentDoneTryTypeByName[TAssessmentTaskName.SENTENCE_ORDER]).meta_parts.length;
            case TAssessmentTaskName.OPEN_QUESTION:
                return 1;
            case TAssessmentTaskName.TEXT:
            case TAssessmentTaskName.IMG:
            case TAssessmentTaskName.AUDIO:
            default:
                return 1;
        }
    };

    const getTaskCorrectAnswersCount = (task: TAssessmentItemBase, mistakesCount: number): number => {
        switch (task.name) {
            case TAssessmentTaskName.TEST_MULTI: {
                const doneTask = task as TGetAssessmentDoneTryTypeByName[TAssessmentTaskName.TEST_MULTI];

                return doneTask.answers.filter((answer) => doneTask.meta_answers.includes(answer)).length;
            }
            default: {
                const total = getTaskCorrectAnswersTotal(task);

                return Math.max(0, Math.min(total, total - mistakesCount));
            }
        }
    };

    return (
        <div className="container pb-5" style={{ maxWidth: "800px" }}>
            <PageTitle title="タスク" urlBack={lessonId !== undefined ? `/lessons/${lessonId}` : undefined} />
            <div className="mt-3 mb-5 box-shadow-main student-assessment-results-summary rounded py-4 px-3 w-75 mx-auto position-relative student-assessment-task-result student-assessment-task-result--error">
                <button
                    type="button"
                    className="btn btn-success position-absolute top-0 end-0 m-3"
                    onClick={handleRetry}
                    disabled={isRetrying}
                >
                    Выполнить ещё раз
                </button>
                <div className="d-flex flex-column align-items-center pt-5">
                    <div className="mb-2 fs-4">
                        Ошибки в тесте: <strong>{totalMistakesCount}</strong>
                    </div>
                    <div className="student-assessment-results-mode justify-content-center">
                        <button
                            type="button"
                            className={`btn btn-sm ${viewMode === "errors" ? "btn-secondary" : "btn-outline-secondary"}`}
                            onClick={() => setViewMode("errors")}
                        >
                            Показать только ошибки
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${viewMode === "all" ? "btn-secondary" : "btn-outline-secondary"}`}
                            onClick={() => setViewMode("all")}
                        >
                            Показать всё
                        </button>
                    </div>
                </div>
            </div>
            {viewMode !== null && (
                <div className="student-assessment-page">
                    <div className="student-assessment-tasks">
                        {visibleBlocks.map((block) => (
                            <React.Fragment key={block.id}>
                                <div className="student-assessment-block-divider">Блок {block.id}</div>
                                {block.tasks.map(({ doneTask, checkedTask, originalIndex }) =>
                                    isDrawableItem(doneTask) ? (
                                        <React.Fragment key={originalIndex}>
                                            <div className="student-assessment-task__wrapper student-assessment-view-task__wrapper">
                                                {doneTask.name !== TAssessmentTaskName.TEXT &&
                                                    doneTask.name !== TAssessmentTaskName.IMG &&
                                                    doneTask.name !== TAssessmentTaskName.AUDIO &&
                                                    (() => {
                                                        const total = getTaskCorrectAnswersTotal(doneTask);
                                                        const mistakes = checkedTask.mistakes_count;
                                                        const correct = getTaskCorrectAnswersCount(doneTask, mistakes);
                                                        const resultClassName =
                                                            mistakes > 0
                                                                ? "student-assessment-task-result student-assessment-task-result--error"
                                                                : "student-assessment-task-result student-assessment-task-result--success";

                                                        return (
                                                            <div className={resultClassName}>
                                                                Верно: {correct} из {total}
                                                            </div>
                                                        );
                                                    })()}
                                                {drawItem(doneTask, checkedTask, originalIndex)}
                                            </div>
                                        </React.Fragment>
                                    ) : null,
                                )}
                            </React.Fragment>
                        ))}

                        {visibleBlocks.length === 0 && (
                            <div className="student-assessment-results-empty">Ошибок нет</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentAssessmentViewDoneTryPage;
