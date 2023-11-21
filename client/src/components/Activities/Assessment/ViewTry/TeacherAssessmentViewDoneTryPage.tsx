import React, { useLayoutEffect, useState } from "react";

import Loading from "components/Common/Loading";
import PageTitle from "components/Common/PageTitle";
import ErrorPage from "components/ErrorPages/ErrorPage";
import { AjaxGet, AjaxPatch } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import {
    TAssessmentCheckedItemBase,
    TAssessmentItemBase,
    TAssessmentTaskName,
    TGetAsseessmentCheckTypeByName,
    TGetStudentTypeByName,
} from "models/Activity/Items/TAssessmentItems";
import { TAssessmentDoneTry } from "models/Activity/Try/TAssessmentTry";
import { useParams } from "react-router-dom";

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
    [key in TAssessmentTaskName]: TAliasProp<TGetStudentTypeByName[key], TGetAsseessmentCheckTypeByName[key]>;
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
}

interface TaskTitleProps {
    cheked: boolean;
    mistakes_count: number;
}

const TaskTitle = ({ cheked, mistakes_count }: TaskTitleProps) => {
    if (!cheked) {
        return <div className="student-assessment-task__title-not-checked">Не проверено</div>;
    }

    if (mistakes_count > 0) {
        return <div>Ошибок: {mistakes_count}</div>;
    }

    return <div>Ошибок нет</div>;
};

const TeacherAssessmentViewDoneTryPage = () => {
    const { id } = useParams();
    const [doneTry, setDoneTry] = useState<LoadStatus.DataDoneOrNotDone<{ data: TAssessmentDoneTry }>>({
        loadStatus: LoadStatus.NONE,
    });
    const [doneTryUpdate, setDoneTryUpdate] = useState<LoadStatus.Type>(LoadStatus.NONE);

    useLayoutEffect(() => {
        setDoneTry({ loadStatus: LoadStatus.LOADING });
        AjaxGet<DoneTryResponse>({ url: `/api/assessment/donetries/${id}` })
            .then((json) => {
                setDoneTry({ loadStatus: LoadStatus.DONE, data: json.done_try });
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
        const newData = { ...doneTry.data, checked_tasks: { ...doneTry.data.checked_tasks, [taskId]: checks } };
        setDoneTryUpdate(LoadStatus.LOADING);
        AjaxPatch<DoneTryResponse>({ url: `/api/assessment/donetries/${id}`, body: { checks: newData.checked_tasks } })
            .then(() => {
                setDoneTry({
                    ...doneTry,
                    data: newData,
                });
                setDoneTryUpdate(LoadStatus.DONE);
            })
            .catch((err) => {
                setDoneTryUpdate(LoadStatus.ERROR);
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
        <div className="container">
            <PageTitle title="Урок" urlBack={`/lessons/${doneTry.data.base_id}`} />
            {doneTry.data.done_tasks.map((doneTask, i) => (
                <div key={i}>
                    <TaskTitle {...doneTry.data.checked_tasks[i]} />
                    {drawItem(doneTask, doneTry.data.checked_tasks[i], i)}
                    <hr />
                </div>
            ))}
            {doneTryUpdate === LoadStatus.LOADING && (
                <div className="loading-modal-fs">
                    <Loading size="xxl" />
                </div>
            )}
        </div>
    );
};

export default TeacherAssessmentViewDoneTryPage;
