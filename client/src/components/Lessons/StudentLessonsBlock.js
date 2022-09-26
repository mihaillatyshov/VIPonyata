import React from 'react'
import { useSelector } from 'react-redux'
import LessonCard from './LessonCard'

const StudentLessonsBlock = () => {
	const lessons = useSelector((state) => state.lessons)

	return (
		<>
			{
				lessons.items === undefined ? (
					<div> Loading... </div>
				) : (
					lessons.items.length > 0 ? (
						<div className="row justify-content-center mt-4">
							{
								lessons.items.map(lesson => {
									return (
										<LessonCard lesson={lesson} key={lesson.Id} />
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

export default StudentLessonsBlock