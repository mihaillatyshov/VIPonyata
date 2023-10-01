import React from "react";
import { AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { Button } from "react-bootstrap";
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
        <div>
            <Button type="button" onClick={handleLogout}>
                Logout
            </Button>
        </div>
    );
};

export default StudentProfilePage;
