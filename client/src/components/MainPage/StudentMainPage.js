import React from 'react'
import { Link } from 'react-router-dom'
import { ServerAPI_POST } from '../../libs/ServerAPI'
import { useDispatch } from 'react-redux'
import { Button } from 'react-bootstrap'
import { setUserData } from '../../redux/slices/userSlice'
import StudentProfile from '../Authentication/StudentProfile'
import StudentDictionary from '../Dictionary/StudentDictionary'
import StudentCorsesBlock from '../Courses/StudentCorsesBlock'

const StudentMainPage = () => {
	const dispatch = useDispatch()

	const handleLogout = () => {
		ServerAPI_POST({
			url: "/api/logout",
			onDataReceived: (data) => {
				console.log(data)
				dispatch(setUserData({ isAuth: false, userData: {} }))
			}
		})
	}

	return (
		<div className="container">
			<div className="row justify-content-center mt-4">
				<StudentProfile />
				<StudentDictionary />
				<div className="col-auto mx-2" style={{ minWidth: "300px", border: "solid 1px" }}>
					Notifications and etc
				</div>
			</div>
			<StudentCorsesBlock />
			<div className='mt-4'>
				<Link to="/upload"> Upload </Link>
				<Button type="button" onClick={handleLogout}> Logout </Button>
			</div>
		</div>
	)
}

export default StudentMainPage