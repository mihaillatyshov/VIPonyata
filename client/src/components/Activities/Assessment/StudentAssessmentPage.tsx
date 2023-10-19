import React, { useEffect } from "react";

import { AjaxGet, AjaxPost } from "libs/ServerAPI";
import {
    TAssessmentAnyItem,
    TAssessmentItemBase,
    TAssessmentItems,
    TAssessmentTaskName,
    TGetStudentTypeByName,
} from "models/Activity/Items/TAssessmentItems";
import { TAssessment } from "models/Activity/TAssessment";
import { Button } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { selectAssessment, setAssessmentInfo, setAssessmentItems } from "redux/slices/assessmentSlice";

import StudentActivityPageHeader from "../StudentActivityPageHeader";
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

type ResponseData = {
    assessment: TAssessment;
    items: TAssessmentItems;
};

type TAliasProp<T extends TAssessmentItemBase> = (props: StudentAssessmentTypeProps<T>) => JSX.Element;

type TAliases = {
    [key in TAssessmentTaskName]: TAliasProp<TGetStudentTypeByName[key]>;
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

    const drawItem = <T extends TAssessmentAnyItem>(item: T, id: number) => {
        const component = aliases[item.name] as TAliasProp<T>;

        return React.createElement(component, { data: item, taskId: id });
    };

    return (
        <div>
            <StudentActivityPageHeader activityInfo={assessment.info} backToLessonCallback={backToLessonHandle} />

            <div>
                <Button onClick={endAssessmentHandle}> Завершить </Button>
            </div>
            <hr />
            <div className="container">
                {assessment.items.map((item: any, i: number) => (
                    <div key={i}>
                        {drawItem(JSON.parse(JSON.stringify(item)), i)}
                        <hr />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentAssessmentPage;
