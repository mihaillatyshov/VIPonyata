import React from "react";

import ShareModal from "components/Share/ShareModal";
import { useUserIsTeacher } from "redux/funcs/user";

const FONT_SIZE = "32px";

interface CourseCardFooterProps {
    id: number;
    courseName: string;
}

const CourseCardFooter = ({ id, courseName }: CourseCardFooterProps) => {
    const isTeacher = useUserIsTeacher();
    const [isShareModalShow, setIsShareModalShow] = React.useState<boolean>(false);

    if (!isTeacher) {
        return null;
    }

    const onShareClick = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsShareModalShow(true);
    };

    return (
        <div className="mt-auto d-flex justify-content-around">
            <i className="bi bi-pencil-square" style={{ fontSize: FONT_SIZE }} />
            <i className="bi bi-reply font-icon-button" style={{ fontSize: FONT_SIZE }} onClick={onShareClick} />
            <i className="bi bi-graph-up" style={{ fontSize: FONT_SIZE }} />
            <ShareModal
                id={id}
                isShow={isShareModalShow}
                name={`Доступ к курсу (${courseName})`}
                type="courses"
                close={() => setIsShareModalShow(false)}
            />
        </div>
    );
};

export default CourseCardFooter;
