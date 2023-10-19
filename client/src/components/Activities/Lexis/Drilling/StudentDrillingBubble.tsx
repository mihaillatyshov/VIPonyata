import React from "react";

import StudentActivityBubble from "components/Activities/Bouble/StudentActivityBouble";
import { useDispatch } from "react-redux";
import { setLexisEndByTime } from "redux/slices/drillingSlice";

type StudentDrillingBubbleProps = {
    drilling: any; // TODO: Remove any
};

const StudentDrillingBubble = ({ drilling }: StudentDrillingBubbleProps) => {
    const dispatch = useDispatch();

    return (
        <StudentActivityBubble
            title="Лексика"
            info={drilling.info}
            name="drilling"
            onDeadline={() => dispatch(setLexisEndByTime())}
        />
    );
};

export default StudentDrillingBubble;
