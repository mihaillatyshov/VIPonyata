import React from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "redux/hooks";
import { selectUser } from "redux/slices/userSlice";

import styles from "./StyleNavBar.module.css";

const Profile = () => {
    const user = useAppSelector(selectUser);

    if (!user.userData) {
        return <div> Error! </div>;
    }

    return (
        <div className="col-auto">
            <Link to={"/profile"}>
                <div className="d-flex">
                    <div className={styles.profileImgWrapper}>
                        <img
                            className={styles.profileImg}
                            alt="profile"
                            src={user.userData.avatar ?? "/img/users/DefaultAvatar.png"}
                        />
                    </div>
                    <div>
                        <div className="mx-auto"> {user.userData.name} </div>
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default Profile;
