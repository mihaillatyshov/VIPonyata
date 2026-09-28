import StudentActivityBubble from "components/Activities/Bubble/StudentActivityBubble";
import { TDrilling } from "models/Activity/TDrilling";

type StudentDrillingBubbleProps = {
    info: TDrilling;
};

const StudentDrillingBubble = ({ info }: StudentDrillingBubbleProps) => {
    return <StudentActivityBubble title="ごい" info={info} name="drilling" showResultsButton={false} />;
};

export default StudentDrillingBubble;
