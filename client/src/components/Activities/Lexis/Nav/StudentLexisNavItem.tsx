import React from "react";
import { useNavigate } from "react-router-dom";

import { LexisTaskName } from "models/Activity/ILexis";

import styles from "./StyleLexisNav.module.css";

type MistakeProps = { mistakeCount?: number };
const Mistake = ({ mistakeCount }: MistakeProps) => {
    if (mistakeCount === undefined) {
        return <></>;
    }

    const getClassName = () => {
        return styles.navBadge + " " + (mistakeCount > 0 ? styles.navBadgeOther : styles.navBadgeZero);
    };

    return (
        <div className={getClassName()}>
            <i className="bi bi-check-lg text-white" />
            {/* {mistakeCount} */}
        </div>
    );
};

export interface StudentLexisNavItemProps {
    to: string;
    name: string;
    taskName: LexisTaskName;
    img: string;
    mistakeCount?: number;
    isSelected: boolean;
    setSelectedTaskCallback: (taskName: LexisTaskName) => void;
}

const StudentLexisNavItem = ({
    to,
    name,
    taskName,
    img,
    mistakeCount,
    isSelected,
    setSelectedTaskCallback,
}: StudentLexisNavItemProps) => {
    const navigate = useNavigate();

    const onClickHandle = () => {
        setSelectedTaskCallback(taskName);
        navigate(to);
    };

    return (
        <div className="col-auto text-center mb-4">
            <div className={`student-lexis-nav__item ${isSelected ? "selected" : ""}`} onClick={onClickHandle}>
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
