import React, { useState } from "react";

import Loading from "components/Common/Loading";
import { TUserData } from "models/TUser";

import styles from "./Share.module.css";

export type TShareUserType = "inside" | "outside";

export interface ShareResponse {
    message: string;
}

interface ShareUserButtonProps {
    userType: TShareUserType;
    isLoading: boolean;
    onClick: (e: React.MouseEvent<HTMLElement>) => void;
}

const ShareUserButton = ({ userType, isLoading, onClick }: ShareUserButtonProps) => {
    if (isLoading) {
        return <Loading size={32} />;
    }

    if (userType === "inside") {
        return (
            <i className={`bi bi-x-lg ${styles.shareRemoveButton}`} style={{ fontSize: "28px" }} onClick={onClick} />
        );
    }
    return <i className={`bi bi-plus-lg ${styles.shareAddButton}`} style={{ fontSize: "32px" }} onClick={onClick} />;
};

interface ShareUserProps {
    user: TUserData;
    userType: TShareUserType;
    share: (userId: number) => Promise<ShareResponse>;
    onShare: (userId: number, type: TShareUserType) => void;
}

const ShareUser = ({ user, userType, share, onShare }: ShareUserProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const runShare = () => {
        if (isLoading) {
            return;
        }

        setIsLoading(true);
        share(user.id)
            .then(() => onShare(user.id, userType))
            .finally(() => setIsLoading(false));
    };

    const onShareClick = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        runShare();
    };

    const onCardKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            runShare();
        }
    };

    return (
        <div
            key={user.id}
            className={`d-flex align-items-center ${styles.shareUser}`}
            onClick={onShareClick}
            onKeyDown={onCardKeyDown}
            role="button"
            tabIndex={0}
        >
            <div className={`d-flex a-link align-items-center ${styles.userLink}`}>
                <div className="me-2">
                    {user.avatar ? (
                        <img className={styles.userAvatar} alt="profile" src={user.avatar} />
                    ) : (
                        <i className={`bi bi-person a-clear navbar-profile ${styles.profileFallbackIcon}`} />
                    )}
                </div>
                <div>
                    <div>{user.nickname}</div>
                    <div className="me-2">{user.name}</div>
                </div>
            </div>
            <ShareUserButton userType={userType} isLoading={isLoading} onClick={onShareClick} />
        </div>
    );
};

export default ShareUser;
