import React from "react";
import { useParams } from "react-router-dom";

import StudentAssessmentBubble from "components/Activities/Assessment/StudentAssessmentBubble";
import StudentDrillingBubble from "components/Activities/Lexis/Drilling/StudentDrillingBubble";
import StudentHieroglyphBubble from "components/Activities/Lexis/Hieroglyph/StudentHieroglyphBubble";
import PageDescription from "components/Common/PageDescription";
import PageTitle from "components/Common/PageTitle";
import { useAppSelector } from "redux/hooks";
import { selectAssessment } from "redux/slices/assessmentSlice";
import { selectDrilling } from "redux/slices/drillingSlice";
import { selectHieroglyph } from "redux/slices/hieroglyphSlice";
import { selectLessons } from "redux/slices/lessonsSlice";
import { useRequestLesson } from "requests/Lesson";

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
                <PageDescription description={lesson?.description} isCentered={true} />

                <div className="d-flex justify-content-center gap-5 flex-wrap mt-5 mb-5">
                    {drilling?.info && <StudentDrillingBubble drilling={drilling} />}
                    {assessment?.info && <StudentAssessmentBubble assessment={assessment} />}
                    {hieroglyph?.info && <StudentHieroglyphBubble hieroglyph={hieroglyph} />}
                </div>
            </div>
        </div>
    );
};

export default StudentLessonPage;
