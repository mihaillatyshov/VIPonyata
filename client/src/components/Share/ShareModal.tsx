import React, { useEffect, useState } from "react";

import { LoadStatus } from "libs/Status";
import { Modal } from "react-bootstrap";
import { GetShareUsersDataType, requestGetShareUsers } from "requests/User";

import ShareModalContent from "./ShareModalContent";

interface ShareModalProps {
    id: number;
    name: string;
    type: "courses" | "lessons";
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

    return (
        <Modal size="xl" show={isShow} onHide={close} dialogClassName="modal-dialog">
            <Modal.Header closeButton className="modal-bg">
                <Modal.Title>{name}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-bg">
                <ShareModalContent users={users} errorMessage={error} />
            </Modal.Body>
        </Modal>
    );
};

export default ShareModal;
