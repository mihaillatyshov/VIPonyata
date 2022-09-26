import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { decDrillingTimeRemaining } from '../../redux/slices/drillingSlice'

const StudentDrillingTimeRemaining = () => {
	const navigate = useNavigate()
	const dispatch = useDispatch()
	const drilling = useSelector((state) => state.drilling)

	const intToHMS = (value) => {
		var hours = Math.floor(value / 3600)
		var minutes = Math.floor((value - (hours * 3600)) / 60)
		var seconds = value - (hours * 3600) - (minutes * 60)

		if (minutes < 10) minutes = "0" + minutes
		if (seconds < 10) seconds = "0" + seconds
		return hours + ':' + minutes + ':' + seconds
	}

	useEffect(() => {
		if (drilling.info.TimeRemaining === 0)
		{
			navigate(`/lessons/${drilling.info.LessonId}`)
			console.log("WATCHER")
		}
	}, [drilling.info.TimeRemaining])

	useEffect(() => {
		const interval = setInterval(() => {
			dispatch(decDrillingTimeRemaining())
		}, 1000)
		return () => clearInterval(interval)
	}, [])

	return (
		<div> 
			{
				drilling.info.TimeRemaining && intToHMS(drilling.info.TimeRemaining)
			}
		</div>
	)
}

export default StudentDrillingTimeRemaining