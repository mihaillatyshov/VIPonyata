import { useState, useEffect } from "react";

const SECOND = 1_000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

export default function useTimer(deadline, interval = SECOND / 2, onDeadLine = undefined) {
	const [timespan, setTimespan] = useState(new Date(deadline) - Date.now());

	useEffect(() => {
		const intervalId = setInterval(() => {
			setTimespan(new Date(deadline) - Date.now());
		}, interval);

		return () => { 
			clearInterval(intervalId);
		};
	}, [deadline, interval]);

	return {
		days: Math.floor(timespan / DAY),
		hours: Math.floor((timespan / HOUR) % 24),
		minutes: Math.floor((timespan / MINUTE) % 60),
		seconds: Math.floor((timespan / SECOND) % 60)
	};
}