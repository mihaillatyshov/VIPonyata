import React, { useEffect, useState } from "react";

import { LoadStatus } from "libs/Status";
import { ActivityName } from "models/Activity/IActivity";
import Modal from "react-bootstrap/Modal";
import { useNavigate } from "react-router-dom";
import { GetActivityDoneTriesDataType, requestGetActivityDoneTries } from "requests/Activity/Activity";

import StudentViewDoneTryModalContent from "./StudentViewDoneTryModalContent";

interface StudentViewDoneTryModalProps {
    isShow: boolean;
    close: () => void;
    id: number;
    name: ActivityName;
}

const StudentViewDoneTryModal = ({ isShow, close, id, name }: StudentViewDoneTryModalProps) => {
    const navigate = useNavigate();

    const [doneTries, setDoneTries] = useState<GetActivityDoneTriesDataType>({
        loadStatus: LoadStatus.NONE,
    });
    const [error, setError] = useState<string>("");

    useEffect(() => {
        if (isShow) {
            requestGetActivityDoneTries({ id, name, setDoneTries, setError });
        }
    }, [isShow, id, name]);

    const openTryPage = (id: number) => {
        close();
        navigate(`/${name}/try/${id}`);
    };

    return (
        <Modal size="lg" show={isShow} onHide={close} dialogClassName="modal-dialog">
            <Modal.Header closeButton className="modal-bg">
                <Modal.Title>Результаты</Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-bg">
                <StudentViewDoneTryModalContent openTryPage={openTryPage} doneTries={doneTries} errorMessage={error} />
            </Modal.Body>
        </Modal>
    );
};

export default StudentViewDoneTryModal;
