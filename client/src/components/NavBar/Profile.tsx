import React from "react";
import { Link } from "react-router-dom";
import { useGetAuthorizedUserSafe } from "redux/funcs/user";

import styles from "./StyleNavBar.module.css";

const Profile = () => {
    const user = useGetAuthorizedUserSafe();

    return (
        <div className="col-auto">
            <Link to={"/profile"}>
                <div className={`d-flex align-items-center ${styles.profileBlock}`}>
                    <div className={styles.profileImgWrapper}>
                        {user.userData.avatar ? (
                            <img className={styles.profileImg} alt="profile" src={user.userData.avatar} />
                        ) : (
                            <i className="bi bi-person-circle font-icon-height-0 a-link" style={{ fontSize: "48px" }} />
                        )}
                    </div>
                    <div className="ms-1 d-none d-md-block">
                        <div className="mx-auto"> {user.userData.name} </div>
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default Profile;
