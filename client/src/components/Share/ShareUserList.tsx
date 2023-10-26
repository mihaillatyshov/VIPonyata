import React from "react";

import { TUserData } from "models/TUser";

import ShareUser, { TShareUserType } from "./ShareUser";

interface ShareUserListProps {
    users: TUserData[];
    usersType: TShareUserType;
}

const ShareUserList = ({ users, usersType }: ShareUserListProps) => {
    return (
        <>
            {users.map((user) => (
                <ShareUser key={user.id} user={user} userType={usersType} />
            ))}
        </>
    );
};

export default ShareUserList;
