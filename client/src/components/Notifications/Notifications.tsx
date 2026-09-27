import { Modal } from "react-bootstrap";

import Loading from "components/Common/Loading";
import ShowMoreButton from "components/Common/ShowMoreButton";
import { LoadStatus } from "libs/Status";
import { useCursorPagedList } from "libs/useCursorPagedList";
import { TStudentNotification, TTeacherNotification } from "models/TNotification";
import { useMarkAllNotificationsAsRead } from "redux/funcs/notificationsHub";
import { isTeacher, useGetAuthorizedUserSafe } from "redux/funcs/user";
import { useAppSelector } from "redux/hooks";
import { selectUnreadNotificationsCount } from "redux/slices/notificationsHubSlice";

import StudentNotificationsContent from "./StudentNotificationsContent";
import TeacherNotificationsContent from "./TeacherNotificationsContent";

const NOTIFICATIONS_PAGE_SIZE = 20;

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
}

const Notifications = ({ isShow, close }: NotificationsProps) => {
    const unreadCount = useAppSelector(selectUnreadNotificationsCount);
    const markAllAsRead = useMarkAllNotificationsAsRead();
    const { items, loadStatus, hasMore, isLoadingMore, isLoadMoreError, loadMore } = useCursorPagedList<
        TTeacherNotification | TStudentNotification,
        "notifications"
    >({
        url: "/api/notifications",
        itemsKey: "notifications",
        pageSize: NOTIFICATIONS_PAGE_SIZE,
        enabled: isShow,
    });

    // Помечаем прочитанными при закрытии, чтобы метка «Новое» была видна на всех загруженных страницах.
    const closeModal = () => {
        if (unreadCount !== 0) {
            markAllAsRead();
        }
        close();
    };

    const renderBody = () => {
        if (loadStatus === LoadStatus.ERROR) {
            return <div className="text-center py-3">Не удалось загрузить уведомления. Попробуйте ещё раз позже.</div>;
        }

        if (loadStatus !== LoadStatus.DONE) {
            return (
                <div className="d-flex justify-content-center py-3">
                    <Loading />
                </div>
            );
        }

        if (items.length === 0) {
            return <div className="text-center py-3">Уведомлений пока нет.</div>;
        }

        return (
            <>
                <Content
                    notifications={items as TTeacherNotification[] | TStudentNotification[]}
                    closeModal={closeModal}
                />
                <ShowMoreButton
                    hasMore={hasMore}
                    isLoading={isLoadingMore}
                    isError={isLoadMoreError}
                    onClick={loadMore}
                    className="d-flex flex-column align-items-center gap-2 mt-3"
                />
            </>
        );
    };

    return (
        <Modal size="xl" show={isShow} onHide={closeModal} className="notifications-modal">
            <Modal.Header closeButton className="modal-bg">
                <Modal.Title>Уведомления</Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-bg">{renderBody()}</Modal.Body>
        </Modal>
    );
};

export default Notifications;
