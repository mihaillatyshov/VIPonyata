import React from "react";

import ITeacherAsssessmentBouble from "components/Activities/Bouble/Teacher/ITeacherAsssessmentBouble";
import TeacherLexisBouble from "components/Activities/Bouble/Teacher/TeacherLexisBouble";
import PageDescription from "components/Common/PageDescription";
import PageTitle from "components/Common/PageTitle";
import { Navigate, useParams } from "react-router-dom";
import { useAppSelector } from "redux/hooks";
import { selectAssessment } from "redux/slices/assessmentSlice";
import { selectDrilling } from "redux/slices/drillingSlice";
import { selectHieroglyph } from "redux/slices/hieroglyphSlice";
import { selectLessons } from "redux/slices/lessonsSlice";
import { useRequestLesson } from "requests/Lesson";

const TeacherLessonPage = () => {
    const { id } = useParams();
    useRequestLesson(id);

    const lesson = useAppSelector(selectLessons).selected;
    const drilling = useAppSelector(selectDrilling);
    const assessment = useAppSelector(selectAssessment);
    const hieroglyph = useAppSelector(selectHieroglyph);

    if (id === undefined || Number.isNaN(id)) {
        return <Navigate to="/" />;
    }

    const lessonId = parseInt(id);

    return (
        <div className="container">
            <PageTitle
                title={lesson?.name}
                urlBack={lesson === undefined ? undefined : `/courses/${lesson.course_id}`}
            />
            <PageDescription description={lesson?.description} />

            <div className="d-flex justify-content-around flex-wrap mt-5">
                <TeacherLexisBouble title="ごい" name="drilling" lessonId={lessonId} info={drilling.info} />

                <ITeacherAsssessmentBouble
                    title="タスク"
                    name="assessment"
                    lessonId={lessonId}
                    info={assessment.info}
                />
                {/* <ActivityBouble title="Урок">
                    <i className="bi bi-plus-lg" style={{ fontSize: "140px" }} />
                </ActivityBouble> */}
                <TeacherLexisBouble title="かんじ" name="hieroglyph" lessonId={lessonId} info={hieroglyph.info} />
            </div>
        </div>
    );
};

export default TeacherLessonPage;
