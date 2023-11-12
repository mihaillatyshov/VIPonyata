import React from "react";

import { AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { useAppDispatch } from "redux/hooks";
import { setUserData } from "redux/slices/userSlice";

const StudentProfilePage = () => {
    const dispatch = useAppDispatch();

    const handleLogout = () => {
        AjaxPost({ url: "/api/logout" }).then(() => {
            dispatch(setUserData({ loadStatus: LoadStatus.DONE, isAuth: false }));
        });
    };
    return (
        <div className="mt-5">
            <input type="button" className="btn btn-success" onClick={handleLogout} value="Выйти???" />
        </div>
    );
};

export default StudentProfilePage;
