import { Link } from "react-router-dom";

import { ActivityName } from "models/Activity/IActivity";
import { TAssessment } from "models/Activity/TAssessment";
import { TDrilling } from "models/Activity/TDrilling";
import { THieroglyph } from "models/Activity/THieroglyph";

import styles from "./StylesTeacherBubble.module.css";

interface TeacherActivityBubbleChildProps {
    name: ActivityName;
    lessonId: number;
    info: TDrilling | THieroglyph | TAssessment | null;
    children?: React.ReactNode;
}

const TeacherActivityBubbleChild = ({ name, lessonId, info, children }: TeacherActivityBubbleChildProps) => {
    if (info === null) {
        return (
            <Link to={`/${name}/create/${lessonId}`} className={"a-link"}>
                <i
                    className={`bi bi-plus-lg ${styles.teacherBubblePlus} ${styles.teacherBubbleIcon}`}
                    style={{ fontSize: "140px" }}
                />
            </Link>
        );
    }

    return (
        <>
            <div className={`text-nowrap text-center w-100 ${styles.teacherBubbleLimit}`}>
                Лимит: {info.time_limit ?? "Нет"}
            </div>
            {children}
        </>
    );
};

export default TeacherActivityBubbleChild;
