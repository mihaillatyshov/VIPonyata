import React from "react";
import { Link } from "react-router-dom";
import { Description, Title } from "./BaseParts/LessonCard";
import LessonCardBase from "./LessonCardBase";
import LessonCardSkill from "./LessonCardSkill";
import { TLesson } from "models/TLesson";
import LessonCardFooter from "./LessonCardFooter";

import styles from "../StyleLessons.module.css";

type LessonCardWithContentProps = {
    lesson: TLesson;
};

const LessonCardWithContent = ({ lesson }: LessonCardWithContentProps) => {
    // TODO: Add img ???
    return (
        <LessonCardBase>
            <Link to={`/lessons/${lesson.id}`} className={"col a-link " + styles.linkLesson}>
                <div className={`d-flex flex-column h-100 ${styles.cardLesson}`}>
                    <Title title={lesson.name} />
                    <Description description={lesson.description} />
                    <LessonCardFooter />
                </div>
            </Link>
            <LessonCardSkill />
        </LessonCardBase>
    );
};

export default LessonCardWithContent;
