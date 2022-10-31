import { useState, useEffect } from "react";

export type TimerProps = {
    deadline: string;
    interval?: number;
    onDeadline?: (() => void) | undefined;
};

const SECOND = 1_000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

export default function useTimer({ deadline, interval = SECOND / 2, onDeadline = undefined }: TimerProps) {
    //const deedlineTime = new Date(deadline);
    //const nowTime = deedlineTime.getTime() - Date.now();
    const [timespan, setTimespan] = useState(new Date(deadline).getTime() - Date.now());

    useEffect(() => {
        const intervalId = setInterval(() => {
            const deadlineData = new Date(deadline);
            if (deadlineData.getTime() <= Date.now()) {
                onDeadline && onDeadline();
            }
            setTimespan(new Date(deadline).getTime() - Date.now());
        }, interval);

        return () => {
            clearInterval(intervalId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deadline, interval]);

    const getVV = (value: number) => {
        return `${value}`.padStart(2, "0");
    };

    const getDays = () => {
        return Math.floor(timespan / DAY);
    };
    const getHours = () => {
        return Math.floor((timespan / HOUR) % 24);
    };
    const getMinutes = () => {
        return Math.floor((timespan / MINUTE) % 60);
    };
    const getSeconds = () => {
        return Math.floor((timespan / SECOND) % 60);
    };

    return {
        days: getDays(),
        hours: getHours(),
        minutes: getMinutes(),
        seconds: getSeconds(),
        getStrHHMMSS: () => {
            return getVV(getHours()) + ":" + getVV(getMinutes()) + ":" + getVV(getSeconds());
        },
    };
}
