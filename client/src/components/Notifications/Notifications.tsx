import React from "react";
import { useAppSelector } from "redux/hooks";
import { isTeacher, selectUser } from "redux/slices/userSlice";
import TeacherNotificationsContent from "./TeacherNotificationsContent";
import StudentNotificationsContent from "./StudentNotificationsContent";
import { Modal } from "react-bootstrap";
import { TAnyNotification, TStudentNotification, TTeacherNotification } from "models/TNotification";

interface ContentProps {
    notifications: TTeacherNotification[] | TStudentNotification[];
}

const Content = ({ notifications }: ContentProps) => {
    const user = useAppSelector(selectUser);
    if (user.userData === undefined) return <div></div>;

    return isTeacher(user.userData) ? (
        <TeacherNotificationsContent notifications={notifications as TTeacherNotification[]} />
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
                <Content notifications={notifications} />
            </Modal.Body>
        </Modal>
    );
};

export default Notifications;
