import { Link } from "react-router-dom";

import { ActivityName } from "models/Activity/IActivity";
import { TAssessment } from "models/Activity/TAssessment";
import { TDrilling } from "models/Activity/TDrilling";
import { THieroglyph } from "models/Activity/THieroglyph";

import styles from "./StylesTeacherBouble.module.css";

interface TeacherActivityBoubleChildProps {
    name: ActivityName;
    lessonId: number;
    info: TDrilling | THieroglyph | TAssessment | null;
    children?: React.ReactNode;
}

const TeacherActivityBoubleChild = ({ name, lessonId, info, children }: TeacherActivityBoubleChildProps) => {
    if (info === null) {
        return (
            <Link to={`/${name}/create/${lessonId}`} className={"a-link"}>
                <i
                    className={`bi bi-plus-lg ${styles.teacherBoublePlus} ${styles.teacherBoubleIcon}`}
                    style={{ fontSize: "140px" }}
                />
            </Link>
        );
    }

    return (
        <>
            <div className={`text-nowrap text-center w-100 ${styles.teacherBoubleLimit}`}>
                Лимит: {info.time_limit ?? "Нет"}
            </div>
            {children}
        </>
    );
};

export default TeacherActivityBoubleChild;
