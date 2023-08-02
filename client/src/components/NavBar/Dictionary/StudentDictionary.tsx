import React from "react";
import { Link } from "react-router-dom";

const StudentDictionary = () => {
    return (
        <div className="col-auto" style={{ border: "solid 1px" }}>
            <Link to="/dictionary">StudentDictionary</Link>
        </div>
    );
};

export default StudentDictionary;
