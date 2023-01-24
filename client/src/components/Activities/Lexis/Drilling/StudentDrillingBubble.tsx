import React from "react";
import { useDispatch } from "react-redux";
import { setDrillingEndByTime } from "redux/slices/drillingSlice";
import StudentActivityBubble from "components/Activities/Bouble/StudentActivityBouble";

type StudentDrillingBubbleProps = {
    drilling: any;
};

const StudentDrillingBubble = ({ drilling }: StudentDrillingBubbleProps) => {
    const dispatch = useDispatch();

    return (
        <StudentActivityBubble
            title="Лексика"
            info={drilling.info}
            name="drilling"
            onDeadline={() => dispatch(setDrillingEndByTime())}
        />
    );
};

export default StudentDrillingBubble;
