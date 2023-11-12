import React from "react";

import { Link } from "react-router-dom";

const StudentDictionary = () => {
    return (
        <div className="d-flex mx-auto flex-column align-items-center">
            <Link className="a-clear navbar-dictionary-title" to="/dictionary">
                じしょ
            </Link>
            <div className="font-icon-height-0 mt-3 mb-4" style={{ fontSize: "22px" }}>
                777
            </div>
        </div>
    );
};

export default StudentDictionary;
