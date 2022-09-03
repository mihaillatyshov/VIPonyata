import React from 'react'
import { Link } from 'react-router-dom'
import { ServerAPI_POST } from '../libs/ServerAPI'
import { useDispatch } from 'react-redux'
import { Button } from 'react-bootstrap'
import { setIsAuth } from '../redux/slices/userSlice'

const MainPage = () => {
	const dispatch = useDispatch()

	const handleLogout = () => { 
		ServerAPI_POST({
			url: "/logout",
			onDataReceived: (data) => {
				console.log(data)
				dispatch(setIsAuth(false))
			}
		})
	}

	return (
		<div>
			<div>MainPage</div>
			<Link to="/upload"> Upload </Link>
			<Button type="button" onClick={handleLogout}> Logout </Button>
		</div>
	)
}

export default MainPage