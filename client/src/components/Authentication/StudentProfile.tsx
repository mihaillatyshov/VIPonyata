import React from "react";
import { useAppSelector } from "redux/hooks";
import { selectUser } from "redux/slices/userSlice";

const StudentProfile = () => {
    const user = useAppSelector(selectUser);

    return (
        <div className="col-auto" style={{ border: "solid 1px" }}>
            <div className="d-flex">
                <img
                    className="profile"
                    alt="profile"
                    src={user.data.avatar === null ? "/img/users/DefaultAvatar.png" : user.data.avatar}
                />
                <div>
                    <div className="mx-auto"> {user.data.name} </div>
                    <div> {user.data.nickname} </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;
