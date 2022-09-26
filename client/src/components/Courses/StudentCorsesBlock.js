import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ServerAPI_GET } from '../../libs/ServerAPI'
import { setCourses } from '../../redux/slices/coursesSlice'
import CourseCard from './CourseCard'

const StudentCorsesBlock = () => {
	const courses = useSelector((state) => state.courses)
	const dispatch = useDispatch()

	useEffect(() => {
		dispatch(setCourses(undefined))
		ServerAPI_GET({
			url: "/api/courses",
			onDataReceived: (data) => {
				console.log(data)
				dispatch(setCourses(data.items))
			}
		})
	}, [])
	
	return (
		<>
			{
				courses.items === undefined ? (
					<div> Loading... </div>
				) : (
					courses.items.length > 0 ? (
						<div className="row justify-content-center mt-4">
							{
								courses.items.map(course => {
									return (
										<CourseCard course={course} key={course.Id} />
									)
								})
							}
						</div>
					) : (
						<div>
							No Items
						</div>
					)
				)
			}
		</>
	)
}

export default StudentCorsesBlock