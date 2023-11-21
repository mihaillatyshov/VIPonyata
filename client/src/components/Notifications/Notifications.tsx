import React from "react";

import { TAnyNotification, TStudentNotification, TTeacherNotification } from "models/TNotification";
import { Modal } from "react-bootstrap";
import { isTeacher, useGetAuthorizedUserSafe } from "redux/funcs/user";

import StudentNotificationsContent from "./StudentNotificationsContent";
import TeacherNotificationsContent from "./TeacherNotificationsContent";

interface ContentProps {
    notifications: TTeacherNotification[] | TStudentNotification[];
    closeModal: () => void;
}

const Content = ({ notifications, closeModal }: ContentProps) => {
    const user = useGetAuthorizedUserSafe();

    return isTeacher(user.userData) ? (
        <TeacherNotificationsContent notifications={notifications as TTeacherNotification[]} closeModal={closeModal} />
    ) : (
        <StudentNotificationsContent notifications={notifications as TStudentNotification[]} />
    );
};

interface NotificationsProps {
    isShow: boolean;
    close: () => void;
    notifications: TAnyNotification[];
}

const Notifications = ({ isShow, close, notifications }: NotificationsProps) => {
    return (
        <Modal size="xl" show={isShow} onHide={close} dialogClassName="modal-dialog">
            <Modal.Header closeButton className="modal-bg">
                <Modal.Title>Уведомления</Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-bg">
                <Content notifications={notifications} closeModal={close} />
            </Modal.Body>
        </Modal>
    );
};

export default Notifications;
