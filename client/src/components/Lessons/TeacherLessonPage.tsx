import React from "react";
import ActivityBouble from "components/Activities/Bouble/ActivityBouble";
import { Navigate, useParams } from "react-router-dom";
import { useRequestLesson } from "requests/Lesson";
import { useAppSelector } from "redux/hooks";
import { selectLessons } from "redux/slices/lessonsSlice";
import { selectDrilling } from "redux/slices/drillingSlice";
import { selectAssessment } from "redux/slices/assessmentSlice";
import { selectHieroglyph } from "redux/slices/hieroglyphSlice";
import Loading from "components/Common/Loading";
import PageTitle from "components/Common/PageTitle";
import TeacherActivityBouble from "components/Activities/Bouble/TeacherActivityBouble";

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

    if (lesson === undefined) {
        return <Loading />;
    }

    return (
        <div className="container">
            <PageTitle title={lesson?.name} />
            <div className="d-flex justify-content-around flex-wrap mt-5">
                <TeacherActivityBouble title="Лексика" name="drilling" lessonId={lessonId} info={drilling.info} />

                {/* <ActivityBouble title="Урок">
                    <i className="bi bi-plus-lg" style={{ fontSize: "140px" }} />
                </ActivityBouble> */}

                <TeacherActivityBouble title="Иероглифы" name="hieroglyph" lessonId={lessonId} info={hieroglyph.info} />
            </div>
        </div>
    );
};

export default TeacherLessonPage;
