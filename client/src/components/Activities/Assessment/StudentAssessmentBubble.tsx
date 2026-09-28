import StudentActivityBubble from "components/Activities/Bubble/StudentActivityBubble";
import { TAssessment } from "models/Activity/TAssessment";

type StudentAssessmentBubbleProps = {
    info: TAssessment;
};

const StudentAssessmentBubble = ({ info }: StudentAssessmentBubbleProps) => {
    return <StudentActivityBubble title="タスク" info={info} name="assessment" />;
};

export default StudentAssessmentBubble;
