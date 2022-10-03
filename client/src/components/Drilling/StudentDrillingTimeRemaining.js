import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import useTimer from '../../libs/useTimer'
import { decDrillingTimeRemaining } from '../../redux/slices/drillingSlice'

const StudentDrillingTimeRemaining = () => {
	const navigate = useNavigate()
	const dispatch = useDispatch()
	const drilling = useSelector((state) => state.drilling)
	const timer = useTimer(drilling.info.Deadline)

	const getHMS = (value) => {
		return `${value}`.padStart(2, "0")
	}

	useEffect(() => {
		if (drilling.info.Deadline)
		{
			const deadlineData = new Date(drilling.info.Deadline)
			if (deadlineData.getTime() <= Date.now()) {
				navigate(`/lessons/${drilling.info.LessonId}`)
				console.log("WATCHER")
			}
		}
	}, [timer])

	useEffect(() => {
		const interval = setInterval(() => {
			dispatch(decDrillingTimeRemaining())
		}, 1000)
		return () => clearInterval(interval)
	}, [])

	return (
		<div> 
			{ getHMS(timer.hours) }:{ getHMS(timer.minutes) }:{ getHMS(timer.seconds) } 
		</div>
	)
}

export default StudentDrillingTimeRemaining