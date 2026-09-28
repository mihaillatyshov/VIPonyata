import StudentActivityBubble from "components/Activities/Bubble/StudentActivityBubble";
import { THieroglyph } from "models/Activity/THieroglyph";

type StudentHieroglyphBubbleProps = {
    info: THieroglyph;
};

const StudentHieroglyphBubble = ({ info }: StudentHieroglyphBubbleProps) => {
    return <StudentActivityBubble title="かんじ" info={info} name="hieroglyph" showResultsButton={false} />;
};

export default StudentHieroglyphBubble;
