import React from "react";

import { TLesson } from "models/TLesson";
import { Link } from "react-router-dom";

import styles from "../StyleLessons.module.css";
import { Description, Title } from "./BaseParts/LessonCard";
import LessonCardBase from "./LessonCardBase";
import LessonCardFooter from "./LessonCardFooter";
import LessonCardSkill from "./LessonCardSkill";

type LessonCardWithContentProps = {
    lesson: TLesson;
};

const LessonCardWithContent = ({ lesson }: LessonCardWithContentProps) => {
    return (
        <LessonCardBase>
            <Link to={`/lessons/${lesson.id}`} className={"col a-link box-shadow-main " + styles.linkLesson}>
                <div className={`d-flex flex-column h-100 ${styles.cardLesson}`}>
                    <div className="d-flex">
                        <div>
                            <Title title={lesson.name} />
                            <Description description={lesson.description} />
                        </div>

                        <div className="ms-auto position-relative">
                            {lesson.img !== null ? (
                                <img
                                    src={lesson.img}
                                    alt=""
                                    style={{ maxHeight: "120px", maxWidth: "120px", position: "absolute", right: "0" }}
                                />
                            ) : null}
                        </div>
                    </div>
                    <LessonCardFooter />
                </div>
            </Link>
            <LessonCardSkill />
        </LessonCardBase>
    );
};

export default LessonCardWithContent;
