import React from "react";

interface DateTimeProps {
    datetime: string;
}

export const NotificationDateTime = ({ datetime }: DateTimeProps) => {
    const [date, time] = datetime.split(" ");
    return (
        <div className="notification__item-time-block">
            <div>{time}</div>
            <div>{date}</div>
        </div>
    );
};
