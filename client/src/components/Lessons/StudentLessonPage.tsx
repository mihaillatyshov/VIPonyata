import { useParams } from "react-router-dom";

import StudentAssessmentBubble from "components/Activities/Assessment/StudentAssessmentBubble";
import StudentDrillingBubble from "components/Activities/Lexis/Drilling/StudentDrillingBubble";
import StudentHieroglyphBubble from "components/Activities/Lexis/Hieroglyph/StudentHieroglyphBubble";
import PageDescription from "components/Common/PageDescription";
import PageTitle from "components/Common/PageTitle";

import { useLessonQuery } from "./useLessonQuery";

const StudentLessonPage = () => {
    const { id } = useParams();
    const lessonData = useLessonQuery(id).data;
    const lesson = lessonData?.lesson;
    const activities = lessonData?.items;

    return (
        <div className="container">
            <div>
                <PageTitle
                    title={lesson?.name}
                    urlBack={lesson === undefined ? undefined : `/courses/${lesson.course_id}`}
                />
                <PageDescription description={lesson?.description} isCentered={true} />

                <div className="d-flex justify-content-center gap-5 flex-wrap mt-5 mb-5">
                    {activities?.drilling && <StudentDrillingBubble info={activities.drilling} />}
                    {activities?.assessment && <StudentAssessmentBubble info={activities.assessment} />}
                    {activities?.hieroglyph && <StudentHieroglyphBubble info={activities.hieroglyph} />}
                </div>
            </div>
        </div>
    );
};

export default StudentLessonPage;
