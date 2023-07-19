import React from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "redux/hooks";
import { selectUser } from "redux/slices/userSlice";

const StudentProfile = () => {
    const user = useAppSelector(selectUser);

    if (!user.userData) {
        return <div> Error! </div>;
    }

    return (
        <div className="col-auto" style={{ border: "solid 1px" }}>
            <Link to={"/profile"}>
                <div className="d-flex">
                    <img
                        className="profile"
                        alt="profile"
                        src={user.userData.avatar === null ? "/img/users/DefaultAvatar.png" : user.userData.avatar}
                    />
                    <div>
                        <div className="mx-auto"> {user.userData.name} </div>
                        {/* <div> {user.userData.nickname} </div> */}
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default StudentProfile;
