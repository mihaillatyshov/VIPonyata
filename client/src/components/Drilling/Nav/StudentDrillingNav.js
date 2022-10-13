import React, { useEffect } from "react"
import { Link } from "react-router-dom"

const StudentDrillingNav = ({ items }) => {
	useEffect(() => {
		for (const item in items) {
			console.log("items", item)
		}
	}, [])

	return (
		<div>
			{
				Object.keys(items).map((key, index) => (
					<span key={index}> <Link to={key}> {key} </Link> </span>
				))
			}
		</div>
	)
}

export default StudentDrillingNav