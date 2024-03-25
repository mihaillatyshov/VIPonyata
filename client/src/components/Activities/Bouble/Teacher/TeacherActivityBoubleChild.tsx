import { ActivityName } from "models/Activity/IActivity";
import { TAssessment } from "models/Activity/TAssessment";
import { TDrilling } from "models/Activity/TDrilling";
import { THieroglyph } from "models/Activity/THieroglyph";
import { Link, useNavigate } from "react-router-dom";

import styles from "./StylesTeacherBouble.module.css";

interface TeacherActivityBoubleChildProps {
    name: ActivityName;
    lessonId: number;
    info: TDrilling | THieroglyph | TAssessment | null;
    children?: React.ReactNode;
}

const TeacherActivityBoubleChild = ({ name, lessonId, info, children }: TeacherActivityBoubleChildProps) => {
    const navigate = useNavigate();

    const footerItemSize = "32px";

    if (info === null) {
        return (
            <Link to={`/${name}/create/${lessonId}`} className={"a-link"}>
                <i className={`bi bi-plus-lg ${styles.teacherBoublePlus}`} style={{ fontSize: "140px" }} />
            </Link>
        );
    }

    const onEditClick = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/${name}/edit/${info.id}`);
    };

    return (
        <>
            <div className="text-nowrap">Лимит: {info.time_limit ?? "Нет"}</div>
            {children}
            <div className={`d-flex justify-content-center w-100 ${styles.teacherBoubleFooter}`}>
                <i
                    className="mx-3 bi bi-pencil-square font-icon-button"
                    style={{ fontSize: footerItemSize }}
                    onClick={onEditClick}
                />
                <i className="mx-3 bi bi-graph-up" style={{ fontSize: footerItemSize }} />
            </div>
        </>
    );
};

export default TeacherActivityBoubleChild;
