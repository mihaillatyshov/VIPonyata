import React from "react";

import { TUserData } from "models/TUser";
import { Link } from "react-router-dom";

import styles from "./Share.module.css";

export type TShareUserType = "inside" | "outside";

interface ShareUserButtonProps {
    userType: TShareUserType;
}

const ShareUserButton = ({ userType }: ShareUserButtonProps) => {
    if (userType === "inside") {
        return <i className={`bi bi-x-lg ${styles.shareRemoveButton}`} style={{ fontSize: "28px" }} />;
    }
    return <i className={`bi bi-plus-lg ${styles.shareAddButton}`} style={{ fontSize: "32px" }} />;
};

interface ShareUserProps {
    user: TUserData;
    userType: TShareUserType;
}

const ShareUser = ({ user, userType }: ShareUserProps) => {
    return (
        <div key={user.id} className={`d-flex align-items-center ${styles.shareUser}`}>
            <Link to={`/profile/${user.id}`} className={`d-flex a-link align-items-center ${styles.userLink}`}>
                <div className="me-2">
                    {user.avatar ? (
                        <img className={styles.userAvatar} alt="profile" src={user.avatar} />
                    ) : (
                        <i className="bi bi-person-circle font-icon-height-0" style={{ fontSize: "40px" }} />
                    )}
                </div>
                <div>
                    <div>{user.nickname}</div>
                    <div className="me-2">{user.name}</div>
                </div>
            </Link>
            <ShareUserButton userType={userType} />
        </div>
    );
};

export default ShareUser;
