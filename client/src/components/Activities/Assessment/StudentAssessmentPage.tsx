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
import { TAssessmentItems } from "models/Activity/Items/TAssessmentItems";

type ResponseData = {
    assessment: TAssessment;
    items: TAssessmentItems;
};

type StudentAssessmentAliasProps = {
    taskName: string;
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
                    if (response.status === 404) navigate("/");
                    if (response.status === 403) navigate(`/lessons/${json.lesson_id}`);
                }
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            console.log("TODO Send Some Changes . . ."); // TODO
        }, 2000);
        return () => clearTimeout(timer);
    }, [assessment]);

    const backToLessonHandle = () => {
        navigate(`/lessons/${assessment.info.lesson_id}`);
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
        { taskName: "text", component: StudentAssessmentText },
        { taskName: "test_single", component: StudentAssessmentTestSingle },
        { taskName: "test_multi", component: StudentAssessmentTestMulti },
        { taskName: "find_pair", component: StudentAssessmentFindPair },
        { taskName: "create_sentence", component: StudentAssessmentCreateSentence },
        { taskName: "fill_spaces_exists", component: StudentAssessmentFillSpacesExists },
        { taskName: "fill_spaces_by_hand", component: StudentAssessmentFillSpacesByHand },
        { taskName: "classification", component: StudentAssessmentClassification },
        { taskName: "sentence_order", component: StudentAssessmentSentenceOrder },
        { taskName: "open_question", component: StudentAssessmentOpenQuestion },
        { taskName: "img", component: StudentAssessmentImg },
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
                        DEBUG
                        <div style={{ whiteSpace: "pre" }}>{JSON.stringify(item, null, "\t")}</div>
                        {drawItem(JSON.parse(JSON.stringify(item)), i)}
                        <hr />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentAssessmentPage;
