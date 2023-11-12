import { useCallback } from "react";

import { IAssessmentName, LexisName } from "models/Activity/IActivity";
import { TAssessment } from "models/Activity/TAssessment";
import { TDrilling } from "models/Activity/TDrilling";
import { THieroglyph } from "models/Activity/THieroglyph";
import { TLessonResponse } from "models/TLesson";
import { useAppDispatch } from "redux/hooks";

export const useSetLexisInfo = () => {
    const dispatch = useAppDispatch();

    const setLexisInfo = useCallback(
        (name: LexisName, data: TLessonResponse, setInfoCallback: (info: TDrilling | THieroglyph) => any) => {
            dispatch(setInfoCallback(data.items[name]));
        },
        [dispatch],
    );

    return setLexisInfo;
};

export const useSetAssessmentInfo = () => {
    const dispatch = useAppDispatch();

    const setAssessmentInfo = useCallback(
        (name: IAssessmentName, data: TLessonResponse, setInfoCallback: (info: TAssessment) => any) => {
            dispatch(setInfoCallback(data.items[name]));
        },
        [dispatch],
    );

    return setAssessmentInfo;
};
