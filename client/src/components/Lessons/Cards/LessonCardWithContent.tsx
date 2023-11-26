import React from "react";

import { TLesson } from "models/TLesson";
import { useNavigate } from "react-router-dom";

import { Description, Title } from "./BaseParts/LessonCard";
import LessonCardBase from "./LessonCardBase";
import LessonCardFooter from "./LessonCardFooter";

type LessonCardWithContentProps = {
    lesson: TLesson;
};

const LessonCardWithContent = ({ lesson }: LessonCardWithContentProps) => {
    const navigate = useNavigate();

    return (
        <LessonCardBase>
            <div
                className="col d-flex flex-column lesson__card-inner"
                onClick={() => navigate(`/lessons/${lesson.id}`)}
            >
                <div className="d-flex">
                    <div className="lesson__card-text-block">
                        <Title title={lesson.name} />
                        <Description description={lesson.description} />
                    </div>

                    {lesson.img !== null ? <img src={lesson.img} alt="" className="lesson__card-img" /> : null}
                </div>
                <LessonCardFooter id={lesson.id} lessonName={lesson.name} />
            </div>
            {/* <LessonCardSkill /> */}
        </LessonCardBase>
    );
};

export default LessonCardWithContent;
