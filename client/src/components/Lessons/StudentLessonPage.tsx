import React, { useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { AjaxGet } from "libs/ServerAPI";
import { ActivityName } from "components/Activities/ActivityUtils";
import { selectLessons, setSelectedLesson } from "redux/slices/lessonsSlice";
import { selectDrilling, setDrillingInfo } from "redux/slices/drillingSlice";
import { selectHieroglyph, setHieroglyphInfo } from "redux/slices/hieroglyphSlice";
import { selectAssessment, setAssessmentInfo } from "redux/slices/assessmentSlice";
import StudentDrillingBubble from "components/Activities/Lexis/Drilling/StudentDrillingBubble";
import StudentHieroglyphBubble from "components/Activities/Lexis/Hieroglyph/StudentHieroglyphBubble";
import StudentAssessmentBubble from "components/Activities/Assessment/StudentAssessmentBubble";
import { TAssessment } from "models/Activity/TAssessment";
import { TDrilling } from "models/Activity/TDrilling";
import { THieroglyph } from "models/Activity/THieroglyph";
import { TLesson } from "models/TLesson";

type ResponseData = {
    lesson: TLesson;
    items: {
        drilling: TDrilling;
        hieroglyph: THieroglyph;
        assessment: TAssessment;
    };
};

const StudentLessonPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const lesson = useAppSelector(selectLessons).selected;
    const drilling = useAppSelector(selectDrilling);
    const assessment = useAppSelector(selectAssessment);
    const hieroglyph = useAppSelector(selectHieroglyph);

    const setActivityInfo = useCallback(
        (
            name: ActivityName,
            data: ResponseData,
            setInfoCallback: (info: TDrilling | THieroglyph | TAssessment) => any
        ) => {
            if (Object.keys(data.items[name]).length !== 0) {
                console.log(`Set ${name} info`, data);
                dispatch(setInfoCallback(data.items[name]));
            }
        },
        [dispatch]
    );

    useEffect(() => {
        dispatch(setSelectedLesson(undefined));
        dispatch(setDrillingInfo(undefined));
        AjaxGet<ResponseData>({ url: `/api/lessons/${id}` })
            .then((json) => {
                dispatch(setSelectedLesson(json.lesson));
                setActivityInfo("drilling", json, setDrillingInfo);
                setActivityInfo("hieroglyph", json, setHieroglyphInfo);
                setActivityInfo("assessment", json, setAssessmentInfo);
            })
            .catch(({ isServerError, json, response }) => {
                if (!isServerError) {
                    if (response.status === 404) navigate("/");
                    if (response.status === 403) navigate(`/courses/${json.course_id}`);
                }
            });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (lesson === undefined) {
        return <p> Loading... </p>;
    }

    return (
        <div className="container">
            <div>
                <div> {lesson.name} </div>
                <div> {lesson.description} </div>
                {drilling && drilling.info && <StudentDrillingBubble drilling={drilling} />}
                {assessment && assessment.info && <StudentAssessmentBubble assessment={assessment} />}
                {hieroglyph && hieroglyph.info && <StudentHieroglyphBubble hieroglyph={hieroglyph} />}
            </div>
        </div>
    );
};

export default StudentLessonPage;
