import React from "react";
import { Link } from "react-router-dom";
import style from "./StyleLessons.module.css";

const LessonCard = ({ lesson }) => {
    return (
        <div className="row justify-content-center">
            <Link to={`/lessons/${lesson.Id}`} className={"col a-link " + style.linkLesson}>
                <div className={style.cardLesson}>
                    {false && <img src="" />}
                    <div>
                        <div> {lesson.Name} </div>
                        <div className="mb-2 text-muted"> D {lesson.Difficulty} </div>
                        <div> DE {lesson.Description} </div>
                    </div>
                </div>
            </Link>
            <div className={"col-auto " + style.skillLesson}>Some Block</div>
        </div>
    );
};

export default LessonCard;
