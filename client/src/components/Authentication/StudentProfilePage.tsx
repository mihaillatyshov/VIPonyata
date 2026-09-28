import React from "react";

import { AjaxPost } from "libs/ServerAPI";
import { resetSession } from "libs/user";

const StudentProfilePage = () => {
    const handleLogout = () => {
        AjaxPost({ url: "/api/logout" }).then(resetSession);
    };
    return (
        <div className="mt-5">
            <input type="button" className="btn btn-success" onClick={handleLogout} value="Выйти???" />
        </div>
    );
};

export default StudentProfilePage;
