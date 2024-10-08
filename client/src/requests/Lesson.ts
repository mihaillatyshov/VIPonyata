import { useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";

import { AjaxGet } from "libs/ServerAPI";
import { TLessonResponse } from "models/TLesson";
import { useSetAssessmentInfo, useSetLexisInfo } from "redux/funcs/activity";
import { useAppDispatch } from "redux/hooks";
import { setAssessmentInfo } from "redux/slices/assessmentSlice";
import { setLexisInfo as setDrillingInfo } from "redux/slices/drillingSlice";
import { setLexisInfo as setHieroglyphInfo } from "redux/slices/hieroglyphSlice";
import { setSelectedLesson } from "redux/slices/lessonsSlice";

export const useRequestLesson = (lessonId: string | undefined) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const setILexisInfo = useSetLexisInfo();
    const setIAssessmentInfo = useSetAssessmentInfo();

    useLayoutEffect(() => {
        dispatch(setSelectedLesson(undefined));
        dispatch(setDrillingInfo(undefined));
        dispatch(setHieroglyphInfo(undefined));
        dispatch(setAssessmentInfo(undefined));

        AjaxGet<TLessonResponse>({ url: `/api/lessons/${lessonId}` })
            .then((json) => {
                dispatch(setSelectedLesson(json.lesson));
                setILexisInfo("drilling", json, setDrillingInfo);
                setILexisInfo("hieroglyph", json, setHieroglyphInfo);
                setIAssessmentInfo("assessment", json, setAssessmentInfo);
            })
            .catch(({ isServerError, response, json }) => {
                if (!isServerError) {
                    if (response.status === 404) navigate("/", { replace: true });
                    if (response.status === 403) navigate(`/courses/${json.course_id}`, { replace: true });
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
