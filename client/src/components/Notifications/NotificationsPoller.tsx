import { useNotificationsPolling } from "redux/funcs/notificationsHub";

/** Единственная точка периодического опроса уведомлений (см. `useNotificationsPolling`). */
const NotificationsPoller = () => {
    useNotificationsPolling();

    return null;
};

export default NotificationsPoller;
