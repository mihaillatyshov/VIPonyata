import React from "react";

import { queryClient } from "libs/queryClient";
import { AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { useAppDispatch } from "redux/hooks";
import { setUserData } from "redux/slices/userSlice";

const StudentProfilePage = () => {
    const dispatch = useAppDispatch();

    const handleLogout = () => {
        AjaxPost({ url: "/api/logout" }).then(() => {
            queryClient.clear();
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
