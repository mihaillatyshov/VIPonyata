import React from "react";
import StudentDictionary from "./Dictionary/StudentDictionary";
import Profile from "./Profile";
import { Link } from "react-router-dom";

const NavBar = () => {
    return (
        <div className="container mainNavBar">
            <div className="row justify-content-center">
                <div className="col-auto">
                    <Link to="/">Главная</Link>
                </div>
                <StudentDictionary />
                <div className="col-auto" style={{ minWidth: "300px", border: "solid 1px" }}>
                    Notifications and etc
                </div>
                <Profile />
            </div>
        </div>
    );
};

export default NavBar;
