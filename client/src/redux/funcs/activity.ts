import { useCallback } from "react";
import { ActivityName } from "components/Activities/ActivityUtils";
import { useAppDispatch } from "redux/hooks";
import { TLessonResponse } from "models/TLesson";
import { TDrilling } from "models/Activity/TDrilling";
import { THieroglyph } from "models/Activity/THieroglyph";
import { TAssessment } from "models/Activity/TAssessment";

export const useSetActivityInfo = () => {
    const dispatch = useAppDispatch();

    const setActivityInfo = useCallback(
        (
            name: ActivityName,
            data: TLessonResponse,
            setInfoCallback: (info: TDrilling | THieroglyph | TAssessment) => any
        ) => {
            dispatch(setInfoCallback(data.items[name]));
        },
        [dispatch]
    );

    return setActivityInfo;
};
