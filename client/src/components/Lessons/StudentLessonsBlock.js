import React from "react"
import { useSelector } from "react-redux"
import LessonCard from "./LessonCard"

const StudentLessonsBlock = () => {
	const lessons = useSelector((state) => state.lessons)

	return (
		<>
			{
				lessons.items === undefined ? (
					<div> Loading... </div>
				) : (
					lessons.items.length > 0 ? (
						<>
							{
								lessons.items.map(lesson => {
									return (
										<LessonCard lesson={lesson} key={lesson.Id} />
									)
								})
							}
						</>
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