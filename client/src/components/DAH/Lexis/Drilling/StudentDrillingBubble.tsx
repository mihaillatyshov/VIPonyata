import React from "react";
import { useDispatch } from "react-redux";
import { setDrillingEndByTime } from "redux/slices/drillingSlice";
import StudentDAHBubble from "components/DAH/Bouble/StudentDAHBouble";

type StudentDrillingBubbleProps = {
    drilling: any;
};

const StudentDrillingBubble = ({ drilling }: StudentDrillingBubbleProps) => {
    const dispatch = useDispatch();

    return (
        <StudentDAHBubble
            title="Лексика"
            info={drilling.info}
            name="drilling"
            onDeadline={() => dispatch(setDrillingEndByTime())}
        />
    );
};

export default StudentDrillingBubble;
