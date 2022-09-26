import React from 'react'
import { Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const CourseCard = ({course}) => {
	return (
		<Link to={`/courses/${course.Id}`} className="col-auto a-card">
			<Card style={{ width: '18rem', height: '100%' }}>
				<Card.Img variant="top" src="" />
				<Card.Body>
					<Card.Title> {course.Name} </Card.Title>
					<Card.Subtitle className="mb-2 text-muted"> {course.Difficulty} </Card.Subtitle>
					<Card.Text> {course.Description} </Card.Text>
				</Card.Body>
			</Card>
		</Link>
	)
}

export default CourseCard