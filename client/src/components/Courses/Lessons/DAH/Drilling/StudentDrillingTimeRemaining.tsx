import React from "react";
import useTimer, { TimerProps } from "libs/useTimer";

const StudentDrillingTimeRemaining = ({ deadline, interval = 1_000 / 2, onDeadline }: TimerProps) => {
    const timer = useTimer({ deadline: deadline, interval: interval, onDeadline: onDeadline });

    return <span>{timer.getStrHHMMSS()}</span>;
};

export default StudentDrillingTimeRemaining;
