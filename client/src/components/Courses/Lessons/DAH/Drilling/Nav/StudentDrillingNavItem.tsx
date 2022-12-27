import { LogInfo } from "libs/Logger";
import React from "react";
import { Link } from "react-router-dom";
import style from "./StyleDrillingNav.module.css";

export type StudentDrillingNavItemProps = {
    to: string;
    name: string;
    img: string;
    mistakeCount: number | undefined;
};

const StudentDrillingNavItem = ({ to, name, img, mistakeCount }: StudentDrillingNavItemProps) => {
    LogInfo(mistakeCount);
    return (
        <div className="col-auto text-center">
            <div className={style.navItem}>
                <Link to={to} className="a-link">
                    <div className="px-auto">
                        <img src={img} width="32px" alt={name} />
                    </div>
                    <div>{name}</div>
                </Link>
                {mistakeCount !== undefined ? (
                    mistakeCount > 0 ? (
                        <div className={`${style.navBadge} ${style.navBadgeOther}`}>{mistakeCount}</div>
                    ) : (
                        <div className={`${style.navBadge} ${style.navBadgeZero}`}>{mistakeCount}</div>
                    )
                ) : (
                    <></>
                )}
            </div>
        </div>
    );
};

export default StudentDrillingNavItem;
