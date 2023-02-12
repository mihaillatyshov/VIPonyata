import React from "react";
import { useDispatch } from "react-redux";
import { setAssessmentEndByTime } from "redux/slices/assessmentSlice";
import StudentActivityBubble from "components/Activities/Bouble/StudentActivityBouble";

type StudentAssessmentBubbleProps = {
    assessment: any;
};

const StudentAssessmentBubble = ({ assessment }: StudentAssessmentBubbleProps) => {
    const dispatch = useDispatch();

    return (
        <StudentActivityBubble
            title="Урок"
            info={assessment.info}
            name="assessment"
            onDeadline={() => dispatch(setAssessmentEndByTime())}
        />
    );
};

export default StudentAssessmentBubble;
