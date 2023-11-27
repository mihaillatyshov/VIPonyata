import React from "react";

import StudentActivityBubble from "components/Activities/Bouble/StudentActivityBouble";
import { useDispatch } from "react-redux";
import { setAssessmentEndByTime } from "redux/slices/assessmentSlice";

type StudentAssessmentBubbleProps = {
    assessment: any;
};

const StudentAssessmentBubble = ({ assessment }: StudentAssessmentBubbleProps) => {
    const dispatch = useDispatch();

    return (
        <StudentActivityBubble
            title="タスク"
            info={assessment.info}
            name="assessment"
            onDeadline={() => dispatch(setAssessmentEndByTime())}
        />
    );
};

export default StudentAssessmentBubble;
