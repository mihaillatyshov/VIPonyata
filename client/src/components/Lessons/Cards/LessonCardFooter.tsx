import React from "react";
import { useNavigate } from "react-router-dom";

import ShareModal from "components/Share/ShareModal";
import { useUserIsTeacher } from "redux/funcs/user";

const FONT_SIZE = "24px";

interface LessonCardFooterProps {
    id: number;
    lessonName: string;
}

const LessonCardFooter = ({ id, lessonName }: LessonCardFooterProps) => {
    const isTeacher = useUserIsTeacher();
    const [isShareModalShow, setIsShareModalShow] = React.useState<boolean>(false);

    const navigate = useNavigate();

    if (!isTeacher) {
        return null;
    }

    const onEditClick = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/lessons/edit/${id}`);
    };

    const onShareClick = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsShareModalShow(true);
    };

    return (
        <div className="mt-auto d-flex justify-content-around">
            <i className="bi bi-pencil-square font-icon-button" style={{ fontSize: FONT_SIZE }} onClick={onEditClick} />
            <i className="bi bi-reply font-icon-button" style={{ fontSize: FONT_SIZE }} onClick={onShareClick} />
            <i className="bi bi-graph-up" style={{ fontSize: FONT_SIZE }} />
            <ShareModal
                id={id}
                isShow={isShareModalShow}
                name={`Доступ к уроку (${lessonName})`}
                type="lessons"
                close={() => setIsShareModalShow(false)}
            />
        </div>
    );
};

export default LessonCardFooter;
