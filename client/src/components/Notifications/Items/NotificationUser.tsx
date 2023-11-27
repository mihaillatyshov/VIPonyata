import React from "react";

import { TUserData } from "models/TUser";

interface NotificationUserProps {
    userData: TUserData;
}

export const NotificationUser = ({ userData }: NotificationUserProps) => {
    return (
        <div className="d-flex gap-2">
            {userData.avatar ? (
                <img className="notification__item-user-avatar" alt="avatar" src={userData.avatar} />
            ) : (
                <i className="bi bi-person-circle a-clear navbar-profile" style={{ fontSize: "48px" }} />
            )}
            <div>
                <div>{userData.name}</div>
                <div>({userData.nickname})</div>
            </div>
        </div>
    );
};
