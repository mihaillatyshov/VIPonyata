import React, { useEffect, useState } from "react";

import { AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { Modal } from "react-bootstrap";
import { GetShareUsersDataType, requestGetShareUsers, ShareType } from "requests/User";

import ShareModalContent from "./ShareModalContent";
import { ShareResponse, TShareUserType } from "./ShareUser";

interface ShareModalProps {
    id: number;
    name: string;
    type: ShareType;
    isShow: boolean;
    close: () => void;
}

const ShareModal = ({ id, name, type, isShow, close }: ShareModalProps) => {
    const [users, setUsers] = useState<GetShareUsersDataType>({
        loadStatus: LoadStatus.NONE,
    });
    const [error, setError] = useState<string>("");

    useEffect(() => {
        if (isShow) {
            requestGetShareUsers({ id, type, setUsers, setError });
        }
    }, [isShow, id, type]);

    const share = async (userId: number) => {
        return AjaxPost<ShareResponse>({ url: `/api/${type}/${id}/users`, body: { user_id: userId } });
    };

    const onShareHandler = (userId: number, type: TShareUserType) => {
        if (users.loadStatus !== LoadStatus.DONE) {
            return;
        }

        const removeId = users.data[type].findIndex((user) => user.id === userId);
        if (removeId === -1) {
            return;
        }

        const otherType = type === "inside" ? "outside" : "inside";
        const user = users.data[type].splice(removeId, 1)[0];
        users.data[otherType].splice(1, 0, user);
        setUsers({ ...users });
    };

    return (
        <Modal size="xl" show={isShow} onHide={close} dialogClassName="modal-dialog">
            <Modal.Header closeButton className="modal-bg">
                <Modal.Title>{name}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-bg">
                <ShareModalContent users={users} errorMessage={error} share={share} onShare={onShareHandler} />
            </Modal.Body>
        </Modal>
    );
};

export default ShareModal;
