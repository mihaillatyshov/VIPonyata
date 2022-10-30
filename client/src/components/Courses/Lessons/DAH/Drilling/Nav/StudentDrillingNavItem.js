import React from "react";
import { Link } from "react-router-dom";
import style from "./StyleDrillingNav.module.css";

const StudentDrillingNavItem = ({ to, name, img }) => {
    return (
        <div className="col-auto text-center">
            <div className={style.navItem}>
                <Link to={to} className="a-link">
                    <div className="px-auto">
                        <img src={img} width="32px" alt={name} />
                    </div>
                    <div>{name}</div>
                </Link>
                <div className={style.navBadge}>4</div>
            </div>
        </div>
    );
};

export default StudentDrillingNavItem;
