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

import { hasMistakesMessage, TaskMistakes } from "./AssessmentViewDoneTryComponents";
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
};

interface DoneTryResponse {
    done_try: TAssessmentDoneTry;
    lesson_id: number;
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

    return (
        <div className="container mb-5 pb-5" style={{ maxWidth: "800px" }}>
            <PageTitle title="タスク" urlBack={lessonId !== undefined ? `/lessons/${lessonId}` : undefined} />
            <hr />
            <div className="student-assessment-tasks">
                {doneTry.data.done_tasks.map((doneTask, i) => (
                    // <div key={i}>
                    //     <TaskMistakes {...doneTry.data.checked_tasks[i]} />
                    //     {drawItem(doneTask, doneTry.data.checked_tasks[i], i)}
                    //     <hr />
                    // </div>

                    <React.Fragment key={i}>
                        <div className="student-assessment-view-task__wrapper">
                            {doneTask.name !== TAssessmentTaskName.IMG && (
                                <div className="student-assessment-task-title">
                                    {studentAssessmentTaskRusNameAliases[doneTask.name]}
                                </div>
                            )}
                            {hasMistakesMessage(doneTask.name) ? (
                                <TaskMistakes {...doneTry.data.checked_tasks[i]} />
                            ) : null}
                            {drawItem(doneTask, doneTry.data.checked_tasks[i], i)}
                        </div>
                        <hr className="my-0 py-0" />
                    </React.Fragment>
                ))}
            </div>
            {saveStatus !== LoadStatus.LOADING ? (
                <input
                    type="button"
                    value="Сохранить и закрыть"
                    className="btn btn-success"
                    onClick={saveChangesAndClose}
                />
            ) : (
                <Loading size={32} />
            )}
            {saveStatus === LoadStatus.ERROR && <InputError message="Не удалось сохранить данные" />}
        </div>
    );
};

export default TeacherAssessmentViewDoneTryPage;
