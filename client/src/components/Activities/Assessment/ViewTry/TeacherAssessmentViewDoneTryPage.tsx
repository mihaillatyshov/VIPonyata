import React, { useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Loading from "components/Common/Loading";
import PageTitle from "components/Common/PageTitle";
import ErrorPage from "components/ErrorPages/ErrorPage";
import InputError from "components/Form/InputError";
import { AjaxGet, AjaxPatch } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import {
    studentAssessmentTaskRusNameAliases,
    TAssessmentCheckedItemBase,
    TAssessmentItemBase,
    TAssessmentTaskName,
    TGetAsseessmentCheckTypeByName,
    TGetAsseessmentDoneTryTypeByName,
} from "models/Activity/Items/TAssessmentItems";
import { TAssessmentDoneTry } from "models/Activity/Try/TAssessmentTry";

import { TeacherAssessmentDoneTryTaskProps } from "./Tasks/AssessmentDoneTryTaskBase";
import { StudentAssessmentDoneTryAudio } from "./Tasks/Student/StudentAssessmentDoneTryAudio";
import { StudentAssessmentDoneTryClassification } from "./Tasks/Student/StudentAssessmentDoneTryClassification";
import { StudentAssessmentDoneTryCreateSentence } from "./Tasks/Student/StudentAssessmentDoneTryCreateSentence";
import { StudentAssessmentDoneTryFillSpacesByHand } from "./Tasks/Student/StudentAssessmentDoneTryFillSpacesByHand";
import { StudentAssessmentDoneTryFillSpacesExists } from "./Tasks/Student/StudentAssessmentDoneTryFillSpacesExists";
import { StudentAssessmentDoneTryFindPair } from "./Tasks/Student/StudentAssessmentDoneTryFindPair";
import { StudentAssessmentDoneTryImg } from "./Tasks/Student/StudentAssessmentDoneTryImg";
import { StudentAssessmentDoneTrySentenceOrder } from "./Tasks/Student/StudentAssessmentDoneTrySentenceOrder";
import { StudentAssessmentDoneTryTestMulti } from "./Tasks/Student/StudentAssessmentDoneTryTestMulti";
import { StudentAssessmentDoneTryTestSingle } from "./Tasks/Student/StudentAssessmentDoneTryTestSingle";
import { StudentAssessmentDoneTryText } from "./Tasks/Student/StudentAssessmentDoneTryText";
import { TeacherAssessmentDoneTryOpenQuestion } from "./Tasks/Teacher/TeacherAssessmentDoneTryOpenQuestion";

type TAliasProp<T extends TAssessmentItemBase, K extends TAssessmentCheckedItemBase> = (
    props: TeacherAssessmentDoneTryTaskProps<T, K>,
) => JSX.Element;

type TAliases = {
    [key in TAssessmentTaskName]: TAliasProp<
        TGetAsseessmentDoneTryTypeByName[key],
        TGetAsseessmentCheckTypeByName[key]
    >;
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
    open_question: TeacherAssessmentDoneTryOpenQuestion,
    img: StudentAssessmentDoneTryImg,
    audio: StudentAssessmentDoneTryAudio,
    block_begin: () => <></>,
    block_end: () => <></>,
};

interface DoneTryResponse {
    done_try: TAssessmentDoneTry;
    lesson_id: number;
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

const TeacherAssessmentViewDoneTryPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [doneTry, setDoneTry] = useState<LoadStatus.DataDoneOrNotDone<{ data: TAssessmentDoneTry }>>({
        loadStatus: LoadStatus.NONE,
    });
    const [lessonId, setLessonId] = useState<number>();
    const [saveStatus, setSaveStatus] = useState<LoadStatus.Type>(LoadStatus.NONE);

    useLayoutEffect(() => {
        setDoneTry({ loadStatus: LoadStatus.LOADING });
        AjaxGet<DoneTryResponse>({ url: `/api/assessment/donetries/${id}` })
            .then((json) => {
                setDoneTry({ loadStatus: LoadStatus.DONE, data: json.done_try });
                setLessonId(json.lesson_id);
            })
            .catch((err) => {
                setDoneTry({ loadStatus: LoadStatus.ERROR });
            });
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

    const changeTask = <K extends TAssessmentCheckedItemBase>(taskId: number, checks: K) => {
        const newChecks = [...doneTry.data.checked_tasks];
        newChecks[taskId] = checks;
        setDoneTry({
            ...doneTry,
            data: { ...doneTry.data, checked_tasks: newChecks },
        });
    };

    const saveChangesAndClose = () => {
        setSaveStatus(LoadStatus.LOADING);
        AjaxPatch({ url: `/api/assessment/donetries/${id}`, body: { checks: doneTry.data.checked_tasks } })
            .then(() => {
                setSaveStatus(LoadStatus.DONE);
                navigate(`/lessons/${lessonId}`);
            })
            .catch(() => {
                setSaveStatus(LoadStatus.ERROR);
            });
    };

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
            changeTask,
        });
    };

    const isDrawableItem = (task: TAssessmentItemBase) => {
        return task.name !== TAssessmentTaskName.BLOCK_BEGIN && task.name !== TAssessmentTaskName.BLOCK_END;
    };

    const getTaskCorrectAnswersTotal = (task: TAssessmentItemBase): number => {
        switch (task.name) {
            case TAssessmentTaskName.TEST_SINGLE:
                return 1;
            case TAssessmentTaskName.TEST_MULTI:
                return (task as TGetAsseessmentDoneTryTypeByName[TAssessmentTaskName.TEST_MULTI]).meta_answers.length;
            case TAssessmentTaskName.FIND_PAIR:
                return (task as TGetAsseessmentDoneTryTypeByName[TAssessmentTaskName.FIND_PAIR]).meta_first.length;
            case TAssessmentTaskName.CREATE_SENTENCE:
                return (task as TGetAsseessmentDoneTryTypeByName[TAssessmentTaskName.CREATE_SENTENCE]).meta_parts
                    .length;
            case TAssessmentTaskName.FILL_SPACES_EXISTS:
                return (task as TGetAsseessmentDoneTryTypeByName[TAssessmentTaskName.FILL_SPACES_EXISTS]).meta_answers
                    .length;
            case TAssessmentTaskName.FILL_SPACES_BY_HAND:
                return (task as TGetAsseessmentDoneTryTypeByName[TAssessmentTaskName.FILL_SPACES_BY_HAND]).meta_answers
                    .length;
            case TAssessmentTaskName.CLASSIFICATION:
                return (
                    task as TGetAsseessmentDoneTryTypeByName[TAssessmentTaskName.CLASSIFICATION]
                ).meta_answers.reduce((acc, col) => acc + col.length, 0);
            case TAssessmentTaskName.SENTENCE_ORDER:
                return (task as TGetAsseessmentDoneTryTypeByName[TAssessmentTaskName.SENTENCE_ORDER]).meta_parts.length;
            case TAssessmentTaskName.OPEN_QUESTION:
                return 1;
            case TAssessmentTaskName.TEXT:
            case TAssessmentTaskName.IMG:
            case TAssessmentTaskName.AUDIO:
            default:
                return 1;
        }
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

    return (
        <div className="container pb-5" style={{ maxWidth: "800px" }}>
            <PageTitle title="タスク" urlBack={lessonId !== undefined ? `/lessons/${lessonId}` : undefined} />
            <div className="student-assessment-page mt-3">
                <div className="student-assessment-tasks">
                    {blocks.map((block) => (
                        <React.Fragment key={block.id}>
                            <div className="student-assessment-block-divider">Блок {block.id}</div>
                            {block.tasks.map(({ doneTask, checkedTask, originalIndex }) =>
                                isDrawableItem(doneTask) ? (
                                    <React.Fragment key={originalIndex}>
                                        <div className="student-assessment-task__wrapper student-assessment-view-task__wrapper">
                                            {doneTask.name !== TAssessmentTaskName.IMG && (
                                                <div className="student-assessment-task-title">
                                                    {studentAssessmentTaskRusNameAliases[doneTask.name]}
                                                </div>
                                            )}
                                            {doneTask.name !== TAssessmentTaskName.TEXT &&
                                                doneTask.name !== TAssessmentTaskName.IMG &&
                                                doneTask.name !== TAssessmentTaskName.AUDIO &&
                                                (() => {
                                                    const total = getTaskCorrectAnswersTotal(doneTask);
                                                    const mistakes = checkedTask.mistakes_count;
                                                    const correct = Math.max(0, Math.min(total, total - mistakes));
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
                </div>
                {saveStatus !== LoadStatus.LOADING ? (
                    <input
                        type="button"
                        value="Сохранить и закрыть"
                        className="btn btn-success mt-3"
                        onClick={saveChangesAndClose}
                    />
                ) : (
                    <Loading size={32} />
                )}
                {saveStatus === LoadStatus.ERROR && (
                    <InputError className="mt-2" message="Не удалось сохранить данные" />
                )}
            </div>
        </div>
    );
};

export default TeacherAssessmentViewDoneTryPage;
