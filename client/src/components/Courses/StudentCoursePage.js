import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { ServerAPI_GET } from '../../libs/ServerAPI'
import { setSelectedCourse } from '../../redux/slices/coursesSlice'
import { setLessons } from '../../redux/slices/lessonsSlice'
import StudentLessonsBlock from '../Lessons/StudentLessonsBlock'


const StudentCoursePage = () => {
	const { id } = useParams()
	const navigate = useNavigate()
	const dispatch = useDispatch()

	useEffect(() => {
		dispatch(setSelectedCourse(undefined))
		dispatch(setLessons(undefined))
		ServerAPI_GET({
			url: `/api/courses/${id}`,
			onDataReceived: (data) => {
				console.log(data)
				dispatch(setSelectedCourse(data.course))
				dispatch(setLessons(data.items))
			},
			handleStatus: (res) => {
				console.log(res.status)
				if (res.status === 403)
					navigate("/")
			}
		})
	}, [])

	return (
		<div>
			<div>Course Info</div>
			<StudentLessonsBlock />
		</div>
	)
}

export default StudentCoursePage