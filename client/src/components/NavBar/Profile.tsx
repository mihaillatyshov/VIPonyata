import React from "react";

import { useNavigate } from "react-router-dom";
import { useGetAuthorizedUserSafe } from "redux/funcs/user";

import styles from "./StyleNavBar.module.css";

const Profile = () => {
    const navigate = useNavigate();
    const user = useGetAuthorizedUserSafe();

    return (
        <div className="col-auto">
            <div
                className={`d-flex flex-column align-items-center ${styles.profileBlock}`}
                onClick={() => navigate("/profile")}
            >
                <div className={styles.profileImgWrapper}>
                    {user.userData.avatar ? (
                        <img className={styles.profileImg} alt="profile" src={user.userData.avatar} />
                    ) : (
                        <i className="bi bi-person-circle a-clear navbar-profile" style={{ fontSize: "40px" }} />
                    )}
                </div>
                <div className="ms-1 d-none d-md-block navbar-profile-name text-center">{user.userData.name}</div>
            </div>
        </div>
    );
};

export default Profile;
