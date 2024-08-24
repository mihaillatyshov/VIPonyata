import React, { useState } from "react";
import { Link } from "react-router-dom";

import Loading from "components/Common/Loading";
import { TUserData } from "models/TUser";

import styles from "./Share.module.css";

export type TShareUserType = "inside" | "outside";

export interface ShareResponse {
    message: string;
}

interface ShareUserButtonProps {
    userType: TShareUserType;
    share: () => Promise<ShareResponse>;
    onShare: (type: TShareUserType) => void;
}

const ShareUserButton = ({ userType, share, onShare }: ShareUserButtonProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const onClickHandler = () => {
        setIsLoading(true);
        share()
            .then(() => onShare(userType))
            .finally(() => setIsLoading(false));
    };

    if (isLoading) {
        return <Loading size={32} />;
    }

    if (userType === "inside") {
        return (
            <i
                className={`bi bi-x-lg ${styles.shareRemoveButton}`}
                style={{ fontSize: "28px" }}
                onClick={onClickHandler}
            />
        );
    }
    return (
        <i className={`bi bi-plus-lg ${styles.shareAddButton}`} style={{ fontSize: "32px" }} onClick={onClickHandler} />
    );
};

interface ShareUserProps {
    user: TUserData;
    userType: TShareUserType;
    share: (userId: number) => Promise<ShareResponse>;
    onShare: (userId: number, type: TShareUserType) => void;
}

const ShareUser = ({ user, userType, share, onShare }: ShareUserProps) => {
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
            <ShareUserButton
                userType={userType}
                share={() => share(user.id)}
                onShare={(type: TShareUserType) => onShare(user.id, type)}
            />
        </div>
    );
};

export default ShareUser;
