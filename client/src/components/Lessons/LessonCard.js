import React from 'react'
import { Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const LessonCard = ({lesson}) => {
	return (
		<Link to={`/lessons/${lesson.Id}`} className="col-auto a-card">
			<Card style={{ width: '18rem', height: '100%' }}>
				<Card.Img variant="top" src="" />
				<Card.Body>
					<Card.Title> {lesson.Name} </Card.Title>
					<Card.Subtitle className="mb-2 text-muted"> {lesson.Difficulty} </Card.Subtitle>
					<Card.Text> {lesson.Description} </Card.Text>
				</Card.Body>
			</Card>
		</Link>
	)
}

export default LessonCard