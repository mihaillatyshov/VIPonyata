import React from "react";

import Loading from "components/Common/Loading";
import { LoadStatus } from "libs/Status";
import { GetShareUsersDataType } from "requests/User";

import ShareUserList from "./ShareUserList";

interface ShareModalContentProps {
    users: GetShareUsersDataType;
    errorMessage: string;
}

const ShareModalContent = ({ users, errorMessage }: ShareModalContentProps) => {
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
                <ShareUserList users={users.data.outside} usersType="outside" />
            </div>
            <div className="col-6">
                <ShareUserList users={users.data.inside} usersType="inside" />
            </div>
        </div>
    );
};

export default ShareModalContent;
