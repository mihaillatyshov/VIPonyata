import React from "react";
import StudentDictionary from "./Dictionary/StudentDictionary";
import Profile from "./Profile";
import { Link } from "react-router-dom";

import styles from "./StyleNavBar.module.css";

const NavBar = () => {
    return (
        <div className="container mainNavBar">
            <div className="row justify-content-center">
                <div className="col-12 col-sm-8 col-md-6 col-lg-4 px-0 align-items-center">
                    <Link to="/">
                        <img src="/svg/Logo.svg" alt="Главная" height={100} />
                    </Link>
                </div>
                <div className="col-4 mx-lg-auto order-2 order-lg-1 d-flex flex-column align-items-center">
                    <StudentDictionary />
                </div>
                <div className="col-12 col-sm-4 col-md-6 col-lg-4 align-items-end order-1 order-lg-2">
                    <div className="d-flex justify-content-end">
                        <div className="">
                            <i className="bi bi-bell-fill font-icon-height-0" style={{ fontSize: "48px" }} />
                        </div>
                        <Profile />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NavBar;
