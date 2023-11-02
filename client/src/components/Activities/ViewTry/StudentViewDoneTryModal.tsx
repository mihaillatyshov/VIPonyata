import React, { useEffect, useState } from "react";

import { LoadStatus } from "libs/Status";
import Modal from "react-bootstrap/Modal";
import { GetActivityDoneTriesDataType, requestGetActivityDoneTries } from "requests/Activity/Activity";

import { ActivityName } from "../ActivityUtils";
import StudentViewDoneTryModalContent from "./StudentViewDoneTryModalContent";

interface StudentViewDoneTryModalProps {
    isShow: boolean;
    close: () => void;
    id: number;
    name: ActivityName;
}

const StudentViewDoneTryModal = ({ isShow, close, id, name }: StudentViewDoneTryModalProps) => {
    const [doneTries, setDoneTries] = useState<GetActivityDoneTriesDataType>({
        loadStatus: LoadStatus.NONE,
    });
    const [error, setError] = useState<string>("");

    useEffect(() => {
        if (isShow) {
            requestGetActivityDoneTries({ id, name, setDoneTries, setError });
        }
    }, [isShow, id, name]);

    return (
        <Modal size="xl" show={isShow} onHide={close} dialogClassName="modal-dialog">
            <Modal.Header closeButton className="modal-bg">
                <Modal.Title>Результаты</Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-bg">
                <StudentViewDoneTryModalContent name={name} doneTries={doneTries} errorMessage={error} />
            </Modal.Body>
        </Modal>
    );
};

export default StudentViewDoneTryModal;
