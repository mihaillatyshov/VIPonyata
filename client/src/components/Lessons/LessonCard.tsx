import React from "react";
import { Link } from "react-router-dom";
import style from "./StyleLessons.module.css";

type LessonCardProps = {
    lesson: any;
};

const LessonCard = ({ lesson }: LessonCardProps) => {
    return (
        <div className="row justify-content-center">
            <Link to={`/lessons/${lesson.id}`} className={"col a-link " + style.linkLesson}>
                <div className={style.cardLesson}>
                    {false && <img src="" alt="" />}
                    <div>
                        <div> {lesson.name} </div>
                        <div className="mb-2 text-muted"> {lesson.difficulty} </div>
                        <div> {lesson.description} </div>
                    </div>
                </div>
            </Link>
            <div className={"col-auto " + style.skillLesson}>Some Block</div>
        </div>
    );
};

export default LessonCard;
