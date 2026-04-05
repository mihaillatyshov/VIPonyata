import { useDispatch } from "react-redux";

import StudentActivityBubble from "components/Activities/Bubble/StudentActivityBubble";
import { setLexisEndByTime } from "redux/slices/drillingSlice";

type StudentDrillingBubbleProps = {
    drilling: any; // TODO: Remove any
};

const StudentDrillingBubble = ({ drilling }: StudentDrillingBubbleProps) => {
    const dispatch = useDispatch();

    return (
        <StudentActivityBubble
            title="ごい"
            info={drilling.info}
            name="drilling"
            onDeadline={() => dispatch(setLexisEndByTime())}
            showResultsButton={false}
        />
    );
};

export default StudentDrillingBubble;
