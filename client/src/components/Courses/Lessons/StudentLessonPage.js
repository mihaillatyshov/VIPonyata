import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { LogError, LogInfo } from "libs/Logger";
import { ServerAPI_GET } from "libs/ServerAPI";
import { setDrillingInfo } from "redux/slices/drillingSlice";
import { setSelectedLesson } from "redux/slices/lessonsSlice";
import style from "./StyleLessons.module.css";
import StudentDrillingBlock from "./DAH/Drilling/StudentDrillingBlock";

const StudentLessonPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const lesson = useSelector((state) => state.lessons.selected);
    const drilling = useSelector((state) => state.drilling);
    const assessment = useSelector((state) => state.assessment);
    const hieroglyph = useSelector((state) => state.hieroglyph);

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
                    {drilling && drilling.info && <StudentDrillingBlock drilling={drilling} />}
                    {assessment && assessment.info && <StudentDrillingBlock drilling={drilling} />}
                    {hieroglyph && hieroglyph.info && <StudentDrillingBlock drilling={drilling} />}
                </div>
            )}
        </div>
    );
};

export default StudentLessonPage;
