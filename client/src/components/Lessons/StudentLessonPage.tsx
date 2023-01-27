import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LogInfo } from "libs/Logger";
import { ServerAPI_GET } from "libs/ServerAPI";
import { selectDrilling, setDrillingInfo } from "redux/slices/drillingSlice";
import { selectLessons, setSelectedLesson } from "redux/slices/lessonsSlice";
import StudentDrillingBubble from "components/Activities/Lexis/Drilling/StudentDrillingBubble";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { selectAssessment } from "redux/slices/assessmentSlice";
import { selectHieroglyph, setHieroglyphInfo } from "redux/slices/hieroglyphSlice";
import StudentHieroglyphBubble from "components/Activities/Lexis/Hieroglyph/StudentHieroglyphBubble";

const StudentLessonPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const lesson = useAppSelector(selectLessons).selected;
    const drilling = useAppSelector(selectDrilling);
    const assessment = useAppSelector(selectAssessment);
    const hieroglyph = useAppSelector(selectHieroglyph);

    useEffect(() => {
        dispatch(setSelectedLesson(undefined));
        dispatch(setDrillingInfo(undefined));
        ServerAPI_GET({
            url: `/api/lessons/${id}`,
            onDataReceived: (data) => {
                LogInfo(data);
                dispatch(setSelectedLesson(data.lesson));
                if (Object.keys(data.items.drilling).length !== 0) {
                    LogInfo("SetDrillingData");
                    dispatch(setDrillingInfo(data.items.drilling));
                }
                if (Object.keys(data.items.hieroglyph).length !== 0) {
                    LogInfo("SetHieroglyphData");
                    dispatch(setHieroglyphInfo(data.items.hieroglyph));
                }
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
                {assessment && assessment.info && <StudentDrillingBubble drilling={drilling} />}
                {hieroglyph && hieroglyph.info && <StudentHieroglyphBubble hieroglyph={hieroglyph} />}
            </div>
        </div>
    );
};

export default StudentLessonPage;
