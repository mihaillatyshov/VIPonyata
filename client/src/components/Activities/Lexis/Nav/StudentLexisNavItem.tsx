import React from "react";
import { useNavigate } from "react-router-dom";
import style from "./StyleLexisNav.module.css";

export type StudentLexisNavItemProps = {
    to: string;
    name: string;
    img: string;
    mistakeCount: number | undefined;
};

type MistakeProps = { mistakeCount: number | undefined };
const Mistake = ({ mistakeCount }: MistakeProps) => {
    if (mistakeCount === undefined) {
        return <></>;
    }

    const getClassName = () => {
        return style.navBadge + " " + (mistakeCount > 0 ? style.navBadgeOther : style.navBadgeZero);
    };

    return <div className={getClassName()}>{mistakeCount}</div>;
};

const StudentLexisNavItem = ({ to, name, img, mistakeCount }: StudentLexisNavItemProps) => {
    const navigate = useNavigate();

    console.log(mistakeCount);

    const onClickHandle = () => {
        navigate(to);
    };

    return (
        <div className="col-auto text-center">
            <div className={style.navItem} onClick={onClickHandle}>
                <div className="px-auto">
                    <img src={img} width="32px" alt={name} />
                </div>
                <div>{name}</div>
                <Mistake mistakeCount={mistakeCount} />
            </div>
        </div>
    );
};

export default StudentLexisNavItem;
