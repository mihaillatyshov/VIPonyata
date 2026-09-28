import { useNotificationsPolling } from "./useNotificationsHub";

/** Единственная точка периодического опроса уведомлений (см. `useNotificationsPolling`). */
const NotificationsPoller = () => {
    useNotificationsPolling();

    return null;
};

export default NotificationsPoller;
