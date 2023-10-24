import React from "react";

import Loading from "components/Common/Loading";
import { LoadStatus } from "libs/Status";
import { GetShareUsersDataType } from "requests/User";

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
                {users.data.inside.map((user) => (
                    <div key={user.id} className="d-flex">
                        <div className="me-2">{user.id}</div>
                        <div className="me-2">{user.name}</div>
                        <div>{user.nickname}</div>
                    </div>
                ))}
            </div>
            <div className="col-6">
                {users.data.outside.map((user) => (
                    <div key={user.id} className="d-flex">
                        <div className="me-2">{user.id}</div>
                        <div className="me-2">{user.name}</div>
                        <div>{user.nickname}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ShareModalContent;
