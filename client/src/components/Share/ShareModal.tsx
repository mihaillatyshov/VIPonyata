import React, { useLayoutEffect, useState } from "react";

import { AjaxGet, isProcessableError } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { TShareUsers } from "models/TUser";
import { Modal } from "react-bootstrap";

interface ShareModalProps {
    id: number;
    name: string;
    type: "courses" | "lessons";
    isShow: boolean;
    close: () => void;
}

interface ShareError {
    message: string;
}

const ShareModal = ({ id, name, type, isShow, close }: ShareModalProps) => {
    const [users, setUsers] = useState<LoadStatus.DataDoneOrNotDone<{ data: TShareUsers }>>({
        loadStatus: LoadStatus.NONE,
    });
    const [error, setError] = useState<string>("");

    useLayoutEffect(() => {
        AjaxGet<TShareUsers>({ url: `/api/${type}/${id}/users` })
            .then((json) => {
                setUsers({ loadStatus: LoadStatus.DONE, data: json });
            })
            .catch((error) => {
                if (isProcessableError<ShareError>(error)) {
                    setError(error.json.message);
                    setUsers({ loadStatus: LoadStatus.ERROR });
                }
            });
    }, []);

    return (
        <Modal size="xl" show={isShow} onHide={close} dialogClassName="modal-dialog">
            <Modal.Header closeButton className="modal-bg">
                <Modal.Title>Доступ для ({name})</Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-bg"></Modal.Body>
        </Modal>
    );
};

export default ShareModal;
