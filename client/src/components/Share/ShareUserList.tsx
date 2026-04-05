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
        <div className="d-flex flex-column gap-2">
            {users.map((user) => (
                <ShareUser key={user.id} user={user} userType={usersType} share={share} onShare={onShare} />
            ))}
        </div>
    );
};

export default ShareUserList;
