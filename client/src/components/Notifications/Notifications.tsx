import React from "react";

import { TAnyNotifications, TStudentNotification, TTeacherNotification } from "models/TNotification";
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
        <StudentNotificationsContent notifications={notifications as TStudentNotification[]} closeModal={closeModal} />
    );
};

interface NotificationsProps {
    isShow: boolean;
    close: () => void;
    notifications: TAnyNotifications;
}

const Notifications = ({ isShow, close, notifications }: NotificationsProps) => {
    return (
        <Modal size="xl" show={isShow} onHide={close}>
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
