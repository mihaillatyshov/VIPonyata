import React from "react";
import { TStudentNotification } from "models/TNotification";

interface StudentNotificationsProps {
    notifications: TStudentNotification[];
}

const StudentNotifications = ({ notifications }: StudentNotificationsProps) => {
    return <div>StudentNotifications</div>;
};

export default StudentNotifications;
