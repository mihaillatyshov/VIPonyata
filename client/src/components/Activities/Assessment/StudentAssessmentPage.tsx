import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { selectAssessment, setAssessmentInfo, setAssessmentItems } from "redux/slices/assessmentSlice";
import StudentActivityPageHeader from "../StudentActivityPageHeader";
import { AjaxGet, AjaxPost } from "libs/ServerAPI";
import { useNavigate, useParams } from "react-router-dom";
import { StudentAssessmentTypeProps } from "./Types/StudentAssessmentTypeProps";
import StudentAssessmentText from "./Types/StudentAssessmentText";
import StudentAssessmentTestSingle from "./Types/StudentAssessmentTestSingle";
import StudentAssessmentTestMulti from "./Types/StudentAssessmentTestMulti";
import StudentAssessmentFindPair from "./Types/StudentAssessmentFindPair";
import StudentAssessmentCreateSentence from "./Types/StudentAssessmentCreateSentence";
import StudentAssessmentFillSpacesExists from "./Types/StudentAssessmentFillSpacesExists";
import StudentAssessmentFillSpacesByHand from "./Types/StudentAssessmentFillSpacesByHand";
import StudentAssessmentClassification from "./Types/StudentAssessmentClassification";
import StudentAssessmentOpenQuestion from "./Types/StudentAssessmentOpenQuestion";
import StudentAssessmentSentenceOrder from "./Types/StudentAssessmentSentenceOrder";
import StudentAssessmentImg from "./Types/StudentAssessmentImg";
import { Button } from "react-bootstrap";
import { TAssessment } from "models/Activity/TAssessment";
import { TAssessmentItems, TAssessmentTaskName } from "models/Activity/Items/TAssessmentItems";

type ResponseData = {
    assessment: TAssessment;
    items: TAssessmentItems;
};

type StudentAssessmentAliasProps = {
    taskName: TAssessmentTaskName;
    component: (props: StudentAssessmentTypeProps<any>) => JSX.Element;
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
            body: { done_tasks: assessment.items }, // TODO FIXIT (TEST MESSAGE)
        }).then(() => {
            backToLessonHandle();
        });
    };

    const aliases: StudentAssessmentAliasProps[] = [
        { taskName: TAssessmentTaskName.TEXT, component: StudentAssessmentText },
        { taskName: TAssessmentTaskName.TEST_SINGLE, component: StudentAssessmentTestSingle },
        { taskName: TAssessmentTaskName.TEST_MULTI, component: StudentAssessmentTestMulti },
        { taskName: TAssessmentTaskName.FIND_PAIR, component: StudentAssessmentFindPair },
        { taskName: TAssessmentTaskName.CREATE_SENTENCE, component: StudentAssessmentCreateSentence },
        { taskName: TAssessmentTaskName.FILL_SPACES_EXISTS, component: StudentAssessmentFillSpacesExists },
        { taskName: TAssessmentTaskName.FILL_SPACES_BY_HAND, component: StudentAssessmentFillSpacesByHand },
        { taskName: TAssessmentTaskName.CLASSIFICATION, component: StudentAssessmentClassification },
        { taskName: TAssessmentTaskName.SENTENCE_ORDER, component: StudentAssessmentSentenceOrder },
        { taskName: TAssessmentTaskName.OPEN_QUESTION, component: StudentAssessmentOpenQuestion },
        { taskName: TAssessmentTaskName.IMG, component: StudentAssessmentImg },
    ];

    if (
        assessment.info === undefined ||
        assessment.info.try === undefined ||
        assessment.info.try === null ||
        assessment.items === undefined
    ) {
        return <div> Loading... </div>;
    }

    const drawItem = (item: any, id: number) => {
        const alias = aliases.find((obj) => obj.taskName === item.name);
        if (alias) {
            return React.createElement(alias.component, { data: item, taskId: id });
        }
        console.warn("No assessment task created!!!");
        return undefined;
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
