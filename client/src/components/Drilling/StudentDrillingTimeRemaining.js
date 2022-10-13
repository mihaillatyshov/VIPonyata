import React, { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import useTimer from "libs/useTimer"

const StudentDrillingTimeRemaining = ({ deadline, interval = 1_000 / 2, onDeadline}) => {
	const navigate = useNavigate()
	const dispatch = useDispatch()
	const drilling = useSelector((state) => state.drilling)
	const timer = useTimer({ deadline: deadline, interval: interval, onDeadline: onDeadline })

	//useEffect(() => {
	//	const deadlineData = new Date(drilling.info.Deadline)
	//	if (deadlineData.getTime() <= Date.now()) {
	//		
	//	}
	//}, [timer])

	return (
		<span> 
			{ timer.getStrHHMMSS() }
		</span>
	)
}

export default StudentDrillingTimeRemaining