import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { LogInfo } from "libs/Logger";
import { ServerAPI_GET } from "libs/ServerAPI";
import { ActivityName } from "components/Activities/ActivityUtils";
import { selectLessons, setSelectedLesson } from "redux/slices/lessonsSlice";
import { selectDrilling, setDrillingInfo } from "redux/slices/drillingSlice";
import { selectHieroglyph, setHieroglyphInfo } from "redux/slices/hieroglyphSlice";
import { selectAssessment, setAssessmentInfo } from "redux/slices/assessmentSlice";
import StudentDrillingBubble from "components/Activities/Lexis/Drilling/StudentDrillingBubble";
import StudentHieroglyphBubble from "components/Activities/Lexis/Hieroglyph/StudentHieroglyphBubble";
import StudentAssessmentBubble from "components/Activities/Assessment/StudentAssessmentBubble";

const StudentLessonPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const lesson = useAppSelector(selectLessons).selected;
    const drilling = useAppSelector(selectDrilling);
    const assessment = useAppSelector(selectAssessment);
    const hieroglyph = useAppSelector(selectHieroglyph);

    const setActivityInfo = (name: ActivityName, data: any, setInfoCallback: (info: any) => any) => {
        if (Object.keys(data.items[name]).length !== 0) {
            console.log(`Set ${name} info`);
            dispatch(setInfoCallback(data.items[name]));
        }
    };

    useEffect(() => {
        dispatch(setSelectedLesson(undefined));
        dispatch(setDrillingInfo(undefined));
        ServerAPI_GET({
            url: `/api/lessons/${id}`,
            onDataReceived: (data) => {
                LogInfo(data);
                dispatch(setSelectedLesson(data.lesson));
                setActivityInfo("drilling", data, setDrillingInfo);
                setActivityInfo("hieroglyph", data, setHieroglyphInfo);
                setActivityInfo("assessment", data, setAssessmentInfo);
            },
            handleStatus: (res) => {
                if (res.status === 404) navigate("/");
                if (res.status === 403) navigate(`/courses/${res.data.course_id}`);
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
