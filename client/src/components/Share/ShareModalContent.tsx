import React from "react";

import Loading from "components/Common/Loading";
import { LoadStatus } from "libs/Status";
import { GetShareUsersDataType } from "requests/User";

import { ShareResponse, TShareUserType } from "./ShareUser";
import ShareUserList from "./ShareUserList";

interface ShareModalContentProps {
    users: GetShareUsersDataType;
    errorMessage: string;
    share: (userId: number) => Promise<ShareResponse>;
    onShare: (userId: number, type: TShareUserType) => void;
}

const ShareModalContent = ({ users, errorMessage, share, onShare }: ShareModalContentProps) => {
    if (users.loadStatus === LoadStatus.ERROR) {
        return <h2 className="text-center">{errorMessage}</h2>;
    }

    if (users.loadStatus !== LoadStatus.DONE) {
        return (
            <div className="d-flex justify-content-center align-items-center">
                <Loading size="xxl" />
            </div>
        );
    }

    return (
        <div className="row">
            <div className="col-6">
                <ShareUserList users={users.data.outside} usersType="outside" share={share} onShare={onShare} />
            </div>
            <div className="col-6">
                <ShareUserList users={users.data.inside} usersType="inside" share={share} onShare={onShare} />
            </div>
        </div>
    );
};

export default ShareModalContent;
