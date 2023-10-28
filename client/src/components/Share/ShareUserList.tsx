import React from "react";

import { TUserData } from "models/TUser";

import ShareUser, { ShareResponse, TShareUserType } from "./ShareUser";

interface ShareUserListProps {
    users: TUserData[];
    usersType: TShareUserType;
    share: (userId: number) => Promise<ShareResponse>;
    onShare: (userId: number, type: TShareUserType) => void;
}

const ShareUserList = ({ users, usersType, share, onShare }: ShareUserListProps) => {
    return (
        <>
            {users.map((user) => (
                <ShareUser key={user.id} user={user} userType={usersType} share={share} onShare={onShare} />
            ))}
        </>
    );
};

export default ShareUserList;
