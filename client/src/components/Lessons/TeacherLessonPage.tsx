import { Navigate, useParams } from "react-router-dom";

import ITeacherAsssessmentBubble from "components/Activities/Bubble/Teacher/ITeacherAsssessmentBubble";
import TeacherLexisBubble from "components/Activities/Bubble/Teacher/TeacherLexisBubble";
import PageDescription from "components/Common/PageDescription";
import PageTitle from "components/Common/PageTitle";

import { useLessonQuery } from "./useLessonQuery";

const TeacherLessonPage = () => {
    const { id } = useParams();
    const lessonData = useLessonQuery(id).data;
    const lesson = lessonData?.lesson;
    const activities = lessonData?.items;

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
            <PageDescription description={lesson?.description} isCentered={true} />

            <div className="d-flex justify-content-center gap-5 flex-wrap mt-5 mb-5">
                <TeacherLexisBubble title="ごい" name="drilling" lessonId={lessonId} info={activities?.drilling} />

                <ITeacherAsssessmentBubble
                    title="タスク"
                    name="assessment"
                    lessonId={lessonId}
                    info={activities?.assessment}
                />
                {/* <ActivityBubble title="Урок">
                    <i className="bi bi-plus-lg" style={{ fontSize: "140px" }} />
                </ActivityBubble> */}
                <TeacherLexisBubble
                    title="かんじ"
                    name="hieroglyph"
                    lessonId={lessonId}
                    info={activities?.hieroglyph}
                />
            </div>
        </div>
    );
};

export default TeacherLessonPage;
