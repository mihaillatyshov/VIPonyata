import React, { useLayoutEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { AssessmentDoneTryTaskBaseProps } from "components/Activities/Assessment/ViewTry/Tasks/AssessmentDoneTryTaskBase";
import { StudentAssessmentDoneTryAudio } from "components/Activities/Assessment/ViewTry/Tasks/Student/StudentAssessmentDoneTryAudio";
import { StudentAssessmentDoneTryClassification } from "components/Activities/Assessment/ViewTry/Tasks/Student/StudentAssessmentDoneTryClassification";
import { StudentAssessmentDoneTryCreateSentence } from "components/Activities/Assessment/ViewTry/Tasks/Student/StudentAssessmentDoneTryCreateSentence";
import { StudentAssessmentDoneTryFillSpacesByHand } from "components/Activities/Assessment/ViewTry/Tasks/Student/StudentAssessmentDoneTryFillSpacesByHand";
import { StudentAssessmentDoneTryFillSpacesExists } from "components/Activities/Assessment/ViewTry/Tasks/Student/StudentAssessmentDoneTryFillSpacesExists";
import { StudentAssessmentDoneTryFindPair } from "components/Activities/Assessment/ViewTry/Tasks/Student/StudentAssessmentDoneTryFindPair";
import { StudentAssessmentDoneTryImg } from "components/Activities/Assessment/ViewTry/Tasks/Student/StudentAssessmentDoneTryImg";
import { StudentAssessmentDoneTryOpenQuestion } from "components/Activities/Assessment/ViewTry/Tasks/Student/StudentAssessmentDoneTryOpenQuestion";
import { StudentAssessmentDoneTrySentenceOrder } from "components/Activities/Assessment/ViewTry/Tasks/Student/StudentAssessmentDoneTrySentenceOrder";
import { StudentAssessmentDoneTryTestMulti } from "components/Activities/Assessment/ViewTry/Tasks/Student/StudentAssessmentDoneTryTestMulti";
import { StudentAssessmentDoneTryTestSingle } from "components/Activities/Assessment/ViewTry/Tasks/Student/StudentAssessmentDoneTryTestSingle";
import { StudentAssessmentDoneTryText } from "components/Activities/Assessment/ViewTry/Tasks/Student/StudentAssessmentDoneTryText";
import Loading from "components/Common/Loading";
import PageTitle from "components/Common/PageTitle";
import ErrorPage from "components/ErrorPages/ErrorPage";
import { AjaxGet } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import {
    TAssessmentCheckedItemBase,
    TAssessmentItemBase,
    TAssessmentTaskName,
    TGetAssessmentCheckTypeByName,
    TGetAssessmentDoneTryTypeByName,
} from "models/Activity/Items/TAssessmentItems";
import { THomeworkAssignment, THomeworkTry } from "models/TTasks";

interface HomeworkTryResponse {
    assignment: THomeworkAssignment;
    try: THomeworkTry;
}

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

const HomeworkResultPage = () => {
    const { tryId } = useParams();
    const [loadStatus, setLoadStatus] = useState<LoadStatus.Type>(LoadStatus.NONE);
    const [assignment, setAssignment] = useState<THomeworkAssignment | null>(null);
    const [homeworkTry, setHomeworkTry] = useState<THomeworkTry | null>(null);

    useLayoutEffect(() => {
        setLoadStatus(LoadStatus.LOADING);
        AjaxGet<HomeworkTryResponse>({ url: `/api/tasks/tries/${tryId}` })
            .then((json) => {
                setAssignment(json.assignment);
                setHomeworkTry(json.try);
                setLoadStatus(LoadStatus.DONE);
            })
            .catch(() => setLoadStatus(LoadStatus.ERROR));
    }, [tryId]);

    if (loadStatus === LoadStatus.ERROR) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Не удалось загрузить результат задания"
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (loadStatus !== LoadStatus.DONE || assignment === null || homeworkTry === null) {
        return <Loading />;
    }

    const drawItem = <T extends TAssessmentItemBase, K extends TAssessmentCheckedItemBase>(
        doneTask: T,
        checkedTask: K,
        taskId: number,
    ) => {
        const component = aliases[doneTask.name] as TAliasProp<T, K>;
        return React.createElement(component, { data: doneTask, checks: checkedTask, taskId });
    };

    const isDrawableItem = (task: TAssessmentItemBase) => {
        return task.name !== TAssessmentTaskName.BLOCK_BEGIN && task.name !== TAssessmentTaskName.BLOCK_END;
    };

    const visibleTaskIndexes = homeworkTry.done_tasks
        .map((task, index) => ({ task, index }))
        .filter(({ task }) => {
            if (!isDrawableItem(task)) {
                return false;
            }

            return true;
        });

    const totalMistakesCount =
        homeworkTry.mistakes_count ??
        homeworkTry.checked_tasks.reduce((acc, task) => acc + (Number(task?.mistakes_count) || 0), 0);

    return (
        <div className="container pb-5" style={{ maxWidth: "860px" }}>
            <PageTitle title={assignment.title} urlBack="/" />
            <div className="mt-3 mb-4 box-shadow-main student-assessment-results-summary rounded py-4 px-3 mx-auto position-relative student-assessment-task-result student-assessment-task-result--error">
                <div className="d-flex flex-column align-items-center">
                    <div className="mb-2 fs-4">
                        Ошибки в задании: <strong>{totalMistakesCount}</strong>
                    </div>
                </div>
            </div>
            <div className="student-assessment-page">
                <div className="student-assessment-tasks">
                    {visibleTaskIndexes.length === 0 ? (
                        <div className="alert alert-success">Заданий для отображения нет.</div>
                    ) : (
                        visibleTaskIndexes.map(({ task, index }) => (
                            <div
                                key={index}
                                className="student-assessment-task__wrapper student-assessment-view-task__wrapper"
                            >
                                {drawItem(
                                    task as TGetAssessmentDoneTryTypeByName[typeof task.name],
                                    homeworkTry.checked_tasks[index] as TGetAssessmentCheckTypeByName[typeof task.name],
                                    index,
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomeworkResultPage;
