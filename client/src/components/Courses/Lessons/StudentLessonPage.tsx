import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LogInfo } from "libs/Logger";
import { ServerAPI_GET } from "libs/ServerAPI";
import { selectDrilling, setDrillingInfo } from "redux/slices/drillingSlice";
import { selectLessons, setSelectedLesson } from "redux/slices/lessonsSlice";
import StudentDrillingBubble from "./DAH/Drilling/StudentDrillingBubble";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { selectAssessment } from "redux/slices/assessmentSlice";
import { selectHieroglyph } from "redux/slices/hieroglyphSlice";

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
                dispatch(setDrillingInfo(data.items.drilling));
            },
            handleStatus: (res) => {
                if (res.status === 403) navigate("/");
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="container">
            {lesson === undefined ? (
                <p> Loading... </p>
            ) : (
                <div>
                    <div> {lesson.Name} </div>
                    <div> {lesson.Description} </div>
                    {drilling && drilling.info && <StudentDrillingBubble drilling={drilling} />}
                    {assessment && assessment.info && <StudentDrillingBubble drilling={drilling} />}
                    {hieroglyph && hieroglyph.info && <StudentDrillingBubble drilling={drilling} />}
                </div>
            )}
        </div>
    );
};

export default StudentLessonPage;
