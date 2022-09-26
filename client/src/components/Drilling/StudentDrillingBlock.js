import React from 'react'
import { Button, Card } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { ServerAPI_POST } from '../../libs/ServerAPI'


const StudentDrillingBlock = ({ drilling }) => {
	const navigate = useNavigate()

	const onButtonClick = () => {
		ServerAPI_POST({
			url: `/api/drilling/${drilling.info.Id}/newtry`,
			onDataReceived: (data) => {
				navigate(`/drilling/${drilling.info.Id}`)
			},
			handleStatus: (res) => {
				if (res.status === 403)
					navigate("/")
			}
		})
	}
	return (
			<Card>
				<div>StudentDrillingBlock</div>
				<div> {drilling.info.Id} </div>
				<div> {drilling.info.LessonId} </div>
				<div> {drilling.info.Description} </div>
				<div> {drilling.info.TimeLimit} </div>
				<Button type="button" onClick={onButtonClick}> Начать </Button>

			</Card>
	)
}

export default StudentDrillingBlock