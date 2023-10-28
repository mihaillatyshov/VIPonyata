import React from "react";

import { useNavigate } from "react-router-dom";

import styles from "./StyleLexisNav.module.css";

export type StudentLexisNavItemProps = {
    to: string;
    name: string;
    img: string;
    mistakeCount?: number;
};

type MistakeProps = { mistakeCount?: number };
const Mistake = ({ mistakeCount }: MistakeProps) => {
    if (mistakeCount === undefined) {
        return <></>;
    }

    const getClassName = () => {
        return styles.navBadge + " " + (mistakeCount > 0 ? styles.navBadgeOther : styles.navBadgeZero);
    };

    return <div className={getClassName()}>{mistakeCount}</div>;
};

const StudentLexisNavItem = ({ to, name, img, mistakeCount }: StudentLexisNavItemProps) => {
    const navigate = useNavigate();

    const onClickHandle = () => {
        navigate(to);
    };

    return (
        <div className="col-auto text-center mb-4">
            <div className={styles.navItem} onClick={onClickHandle}>
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
