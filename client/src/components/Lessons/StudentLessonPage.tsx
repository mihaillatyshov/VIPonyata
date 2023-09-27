import React from "react";
import { useAppSelector } from "redux/hooks";
import { useParams } from "react-router-dom";
import { selectLessons } from "redux/slices/lessonsSlice";
import { selectDrilling } from "redux/slices/drillingSlice";
import { selectHieroglyph } from "redux/slices/hieroglyphSlice";
import { selectAssessment } from "redux/slices/assessmentSlice";
import StudentDrillingBubble from "components/Activities/Lexis/Drilling/StudentDrillingBubble";
import StudentHieroglyphBubble from "components/Activities/Lexis/Hieroglyph/StudentHieroglyphBubble";
import StudentAssessmentBubble from "components/Activities/Assessment/StudentAssessmentBubble";
import { useRequestLesson } from "requests/Lesson";
import PageTitle from "components/Common/PageTitle";

const StudentLessonPage = () => {
    const { id } = useParams();
    const lesson = useAppSelector(selectLessons).selected;
    const drilling = useAppSelector(selectDrilling);
    const assessment = useAppSelector(selectAssessment);
    const hieroglyph = useAppSelector(selectHieroglyph);

    useRequestLesson(id);

    return (
        <div className="container">
            <div>
                <PageTitle
                    title={lesson?.name}
                    urlBack={lesson === undefined ? undefined : `/courses/${lesson.course_id}`}
                />
                <div> {lesson?.description} </div>
                <div className="d-flex justify-content-around flex-wrap">
                    {drilling?.info && <StudentDrillingBubble drilling={drilling} />}
                    {assessment?.info && <StudentAssessmentBubble assessment={assessment} />}
                    {hieroglyph?.info && <StudentHieroglyphBubble hieroglyph={hieroglyph} />}
                </div>
            </div>
        </div>
    );
};

export default StudentLessonPage;
