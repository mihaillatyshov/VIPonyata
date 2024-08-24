import { useEffect, useState } from "react";

export type TimerProps = {
    deadline: string;
    interval?: number;
    onDeadline?: () => void;
};

export const SECOND = 1_000;
export const MINUTE = SECOND * 60;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;

export const getVV = (value: number) => `${value}`.padStart(2, "0");

export const getDays = (timespan: number) => Math.floor(timespan / DAY);
export const getHours = (timespan: number) => Math.floor((timespan / HOUR) % 24);
export const getMinutes = (timespan: number) => Math.floor((timespan / MINUTE) % 60);
export const getSeconds = (timespan: number) => Math.floor((timespan / SECOND) % 60);

export const getStrHHMMSS = (timespan: number) => {
    return getVV(getHours(timespan)) + ":" + getVV(getMinutes(timespan)) + ":" + getVV(getSeconds(timespan));
};

export default function useTimer({ deadline, interval = SECOND / 2, onDeadline = undefined }: TimerProps) {
    const [timespan, setTimespan] = useState(new Date(deadline).getTime() - Date.now());

    useEffect(() => {
        const intervalId = setInterval(() => {
            const deadlineData = new Date(deadline);
            if (deadlineData.getTime() <= Date.now()) {
                onDeadline?.();
            }
            setTimespan(new Date(deadline).getTime() - Date.now());
        }, interval);

        return () => {
            clearInterval(intervalId);
        };
    }, [deadline, interval]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        days: getDays(timespan),
        hours: getHours(timespan),
        minutes: getMinutes(timespan),
        seconds: getSeconds(timespan),
        getStrHHMMSS: () => {
            return getVV(getHours(timespan)) + ":" + getVV(getMinutes(timespan)) + ":" + getVV(getSeconds(timespan));
        },
    };
}
