import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageDescription from "components/Common/PageDescription";
import PageTitle from "components/Common/PageTitle";
import InputError from "components/Form/InputError";
import { PyErrorDict } from "libs/PyError";
import { AjaxGet, AjaxPost } from "libs/ServerAPI";
import {
    studentAssessmentTaskRusNameAliases,
    TAssessmentItemBase,
    TAssessmentTaskName,
    TGetAssessmentStudentTypeByName,
    TStudentAssessmentAnyItem,
    TStudentAssessmentItems,
} from "models/Activity/Items/TAssessmentItems";
import { TAssessment } from "models/Activity/TAssessment";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { selectAssessment, setAssessmentInfo, setAssessmentItems } from "redux/slices/assessmentSlice";

import StudentActivityDeadline from "../StudentActivityDeadline";
import StudentAssessmentAudio from "./Types/StudentAssessmentAudio";
import StudentAssessmentClassification from "./Types/StudentAssessmentClassification";
import StudentAssessmentCreateSentence from "./Types/StudentAssessmentCreateSentence";
import StudentAssessmentFillSpacesByHand from "./Types/StudentAssessmentFillSpacesByHand";
import StudentAssessmentFillSpacesExists from "./Types/StudentAssessmentFillSpacesExists";
import StudentAssessmentFindPair from "./Types/StudentAssessmentFindPair";
import StudentAssessmentImg from "./Types/StudentAssessmentImg";
import StudentAssessmentOpenQuestion from "./Types/StudentAssessmentOpenQuestion";
import StudentAssessmentSentenceOrder from "./Types/StudentAssessmentSentenceOrder";
import StudentAssessmentTestMulti from "./Types/StudentAssessmentTestMulti";
import StudentAssessmentTestSingle from "./Types/StudentAssessmentTestSingle";
import StudentAssessmentText from "./Types/StudentAssessmentText";
import { StudentAssessmentTypeProps } from "./Types/StudentAssessmentTypeProps";
import { validateStudentAssessmentTasksFilled } from "./validation/validateStudentAssessmentTasksFilled";

type ResponseData = {
    assessment: TAssessment;
    items: TStudentAssessmentItems;
};

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
};

const StudentAssessmentPage = () => {
    const { id } = useParams();
    const dispatch = useAppDispatch();
    const assessment = useAppSelector(selectAssessment);
    const navigate = useNavigate();
    const [errors, setErrors] = useState<PyErrorDict>({ errors: {}, message: "" });

    useEffect(() => {
        dispatch(setAssessmentInfo(undefined));
        AjaxGet<ResponseData>({ url: `/api/assessment/${id}` })
            .then((json) => {
                dispatch(setAssessmentInfo(json.assessment));
                dispatch(setAssessmentItems(json.items));
            })
            .catch(({ isServerError, json, response }) => {
                if (!isServerError) {
                    if (response.status === 404) navigate("/", { replace: true });
                    if (response.status === 403) navigate(`/lessons/${json.lesson_id}`, { replace: true });
                }
            });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const timer = setTimeout(() => {
            AjaxPost({ url: `/api/assessment/${id}/newdonetasks`, body: { done_tasks: assessment.items } });
        }, 2000);
        return () => clearTimeout(timer);
    }, [assessment, id]);

    const backToLessonHandle = () => {
        navigate(`/lessons/${assessment.info.lesson_id}`, { replace: true });
    };

    const endAssessmentHandle = () => {
        const validationFieldsFilledResult = validateStudentAssessmentTasksFilled(assessment.items);
        if (validationFieldsFilledResult !== undefined) {
            setErrors(validationFieldsFilledResult);
            return;
        }
        setErrors({ errors: {}, message: "" });
        AjaxPost({
            url: `/api/assessment/${id}/endtry`,
            body: { done_tasks: assessment.items },
        }).then(() => {
            backToLessonHandle();
        });
    };

    if (
        assessment.info === undefined ||
        assessment.info.try === undefined ||
        assessment.info.try === null ||
        assessment.items === undefined
    ) {
        return <div> Loading... </div>;
    }

    const drawItem = <T extends TStudentAssessmentAnyItem>(item: T, id: number) => {
        const component = aliases[item.name] as TAliasProp<T>;

        return React.createElement(component, { data: item, taskId: id });
    };

    return (
        <div className="container pb-5" style={{ maxWidth: "800px" }}>
            <PageTitle title="タスク" urlBack={`/lessons/${assessment.info.lesson_id}`} />
            <PageDescription description={assessment.info.description} className="mb-1" />
            <StudentActivityDeadline activityInfo={assessment.info} />

            <hr />
            <div className="student-assessment-tasks">
                {assessment.items.map((item, i: number) => (
                    <React.Fragment key={i}>
                        <div className="student-assessment-task__wrapper">
                            {item.name !== TAssessmentTaskName.IMG && (
                                <div className="student-assessment-task-title">
                                    {studentAssessmentTaskRusNameAliases[item.name]}
                                </div>
                            )}
                            {drawItem(JSON.parse(JSON.stringify(item)), i)}
                        </div>
                        {errors.errors[`${i}`] !== undefined ? (
                            <InputError message={errors.errors[`${i}`].message} />
                        ) : null}
                        <hr className="my-0 py-0" />
                    </React.Fragment>
                ))}
            </div>
            <div className="mb-5">
                <input type="button" className="btn btn-success mt-3" onClick={endAssessmentHandle} value="Завершить" />
                <InputError className="mt-1" message={errors.message} />
            </div>
        </div>
    );
};

export default StudentAssessmentPage;
