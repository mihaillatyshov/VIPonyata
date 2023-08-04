import { useLayoutEffect } from "react";
import { AjaxGet } from "libs/ServerAPI";
import { TLessonResponse } from "models/TLesson";
import { useNavigate } from "react-router-dom";
import { useSetActivityInfo } from "redux/funcs/activity";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentInfo } from "redux/slices/assessmentSlice";
import { setDrillingInfo } from "redux/slices/drillingSlice";
import { setHieroglyphInfo } from "redux/slices/hieroglyphSlice";
import { setSelectedLesson } from "redux/slices/lessonsSlice";

export const useRequestLesson = (lessonId: string | undefined) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const setActivityInfo = useSetActivityInfo();

    useLayoutEffect(() => {
        AjaxGet<TLessonResponse>({ url: `/api/lessons/${lessonId}` })
            .then((json) => {
                console.log(json);
                dispatch(setSelectedLesson(json.lesson));
                setActivityInfo("drilling", json, setDrillingInfo);
                setActivityInfo("hieroglyph", json, setHieroglyphInfo);
                setActivityInfo("assessment", json, setAssessmentInfo);
            })
            .catch(({ isServerError, response, json }) => {
                console.log(isServerError, response.status, json);
                if (!isServerError) {
                    if (response.status === 404) navigate("/");
                    if (response.status === 403) navigate(`/courses/${json.course_id}`);
                }
            });

        return () => {
            dispatch(setSelectedLesson(undefined));
            dispatch(setDrillingInfo(undefined));
            dispatch(setHieroglyphInfo(undefined));
            dispatch(setAssessmentInfo(undefined));
        };
    }, [lessonId]); // eslint-disable-line react-hooks/exhaustive-deps
};
