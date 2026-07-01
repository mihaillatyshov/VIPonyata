import React, { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import StudentAssessmentAudio from "components/Activities/Assessment/Types/StudentAssessmentAudio";
import StudentAssessmentClassification from "components/Activities/Assessment/Types/StudentAssessmentClassification";
import StudentAssessmentCreateSentence from "components/Activities/Assessment/Types/StudentAssessmentCreateSentence";
import StudentAssessmentFillSpacesByHand from "components/Activities/Assessment/Types/StudentAssessmentFillSpacesByHand";
import StudentAssessmentFillSpacesExists from "components/Activities/Assessment/Types/StudentAssessmentFillSpacesExists";
import StudentAssessmentFindPair from "components/Activities/Assessment/Types/StudentAssessmentFindPair";
import StudentAssessmentImg from "components/Activities/Assessment/Types/StudentAssessmentImg";
import StudentAssessmentOpenQuestion from "components/Activities/Assessment/Types/StudentAssessmentOpenQuestion";
import StudentAssessmentSentenceOrder from "components/Activities/Assessment/Types/StudentAssessmentSentenceOrder";
import StudentAssessmentTestMulti from "components/Activities/Assessment/Types/StudentAssessmentTestMulti";
import StudentAssessmentTestSingle from "components/Activities/Assessment/Types/StudentAssessmentTestSingle";
import StudentAssessmentText from "components/Activities/Assessment/Types/StudentAssessmentText";
import { StudentAssessmentTypeProps } from "components/Activities/Assessment/Types/StudentAssessmentTypeProps";
import { validateStudentAssessmentTasksFilled } from "components/Activities/Assessment/validation/validateStudentAssessmentTasksFilled";
import Loading from "components/Common/Loading";
import PageTitle from "components/Common/PageTitle";
import ErrorPage from "components/ErrorPages/ErrorPage";
import InputError from "components/Form/InputError";
import { PyErrorDict } from "libs/PyError";
import { AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import {
    TAssessmentItemBase,
    TAssessmentTaskName,
    TGetAssessmentStudentTypeByName,
    TStudentAssessmentAnyItem,
    TStudentAssessmentItems,
} from "models/Activity/Items/TAssessmentItems";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { selectAssessment, setAssessmentInfo, setAssessmentItems } from "redux/slices/assessmentSlice";

interface HomeworkStartResponse {
    assignment: {
        id: number;
        title: string;
    } | null;
    try: {
        id: number;
        end_datetime: string | null;
    };
    items: TStudentAssessmentItems;
}

type TAliasProp<T extends TAssessmentItemBase> = (props: StudentAssessmentTypeProps<T>) => JSX.Element;

type TAliases = {
    [key in TAssessmentTaskName]: TAliasProp<TGetAssessmentStudentTypeByName[key]>;
};

const aliases: TAliases = {
    text: StudentAssessmentText,
    test_single: StudentAssessmentTestSingle,
    test_multi: StudentAssessmentTestMulti,
    find_pair: StudentAssessmentFindPair,
    create_sentence: StudentAssessmentCreateSentence,
    fill_spaces_exists: StudentAssessmentFillSpacesExists,
    fill_spaces_by_hand: StudentAssessmentFillSpacesByHand,
    classification: StudentAssessmentClassification,
    sentence_order: StudentAssessmentSentenceOrder,
    open_question: StudentAssessmentOpenQuestion,
    img: StudentAssessmentImg,
    audio: StudentAssessmentAudio,
    block_begin: () => <></>,
    block_end: () => <></>,
};

const StudentHomeworkAssignmentPage = () => {
    const { assignmentId } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const assessment = useAppSelector(selectAssessment);
    const [loadStatus, setLoadStatus] = useState<LoadStatus.Type>(LoadStatus.NONE);
    const [errors, setErrors] = useState<PyErrorDict>({ errors: {}, message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useLayoutEffect(() => {
        dispatch(setAssessmentInfo(undefined));
        setLoadStatus(LoadStatus.LOADING);
        AjaxPost<HomeworkStartResponse>({ url: `/api/tasks/assignments/${assignmentId}/start`, body: {} })
            .then((json) => {
                if (json.try.end_datetime) {
                    navigate(`/tasks/tries/${json.try.id}`, { replace: true });
                    return;
                }

                dispatch(setAssessmentInfo({ title: json.assignment?.title ?? "Задание", try: json.try }));
                dispatch(setAssessmentItems(json.items));
                setLoadStatus(LoadStatus.DONE);
            })
            .catch(() => setLoadStatus(LoadStatus.ERROR));
    }, [assignmentId, dispatch, navigate]);

    useEffect(() => {
        if (loadStatus !== LoadStatus.DONE || assessment.items === undefined) {
            return;
        }

        const timer = window.setTimeout(() => {
            AjaxPost({
                url: `/api/tasks/assignments/${assignmentId}/save`,
                body: { done_tasks: assessment.items },
            }).catch(() => undefined);
        }, 2000);

        return () => window.clearTimeout(timer);
    }, [assessment.items, assignmentId, loadStatus]);

    if (loadStatus === LoadStatus.ERROR) {
        return (
            <ErrorPage
                errorImg="/svg/SomethingWrong.svg"
                textMain="Не удалось загрузить задание"
                textDisabled="Попробуйте перезагрузить страницу"
            />
        );
    }

    if (loadStatus !== LoadStatus.DONE || assessment.info === undefined || assessment.items === undefined) {
        return <Loading />;
    }

    const drawItem = <T extends TStudentAssessmentAnyItem>(item: T, taskId: number) => {
        const component = aliases[item.name] as TAliasProp<T>;
        return React.createElement(component, { data: item, taskId });
    };

    const shouldDrawTaskValidation = (itemId: number) => errors.errors[`${itemId}`] !== undefined;

    const handleFinish = () => {
        const validationResult = validateStudentAssessmentTasksFilled(assessment.items);
        if (validationResult !== undefined) {
            setErrors(validationResult);
            return;
        }

        setErrors({ errors: {}, message: "" });
        setIsSubmitting(true);
        AjaxPost<{ try: { id: number } }>({
            url: `/api/tasks/assignments/${assignmentId}/end`,
            body: { done_tasks: assessment.items },
        })
            .then((json) => {
                navigate(`/tasks/tries/${json.try.id}`, { replace: true });
            })
            .finally(() => setIsSubmitting(false));
    };

    return (
        <div className="container pb-5" style={{ maxWidth: "860px" }}>
            <PageTitle title={assessment.info.title} urlBack="/" />
            <div className="student-assessment-page mt-3">
                <div className="student-assessment-tasks">
                    {assessment.items.map((item, itemId) =>
                        item.name !== TAssessmentTaskName.BLOCK_BEGIN && item.name !== TAssessmentTaskName.BLOCK_END ? (
                            <React.Fragment key={itemId}>
                                <div className="student-assessment-task__wrapper">{drawItem(item, itemId)}</div>
                                {shouldDrawTaskValidation(itemId) ? (
                                    <div className="mt-2 mb-3">
                                        <InputError inputName={`${itemId}`} error={errors} />
                                    </div>
                                ) : null}
                            </React.Fragment>
                        ) : null,
                    )}
                </div>
                {errors.message ? <div className="alert alert-warning mt-3">{errors.message}</div> : null}
                <div className="d-flex justify-content-center mt-4">
                    <button
                        type="button"
                        className="btn btn-success px-4"
                        onClick={handleFinish}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Отправляем..." : "Отправить"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentHomeworkAssignmentPage;
