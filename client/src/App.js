import './App.css'
import LoginPage from './components/Authentication/LoginPage'
import { ServerAPI_GET, SetIP } from './libs/ServerAPI'
import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setIsAuth } from './redux/slices/userSlice'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoadingPage from './components/LoadingPage'
import MainPage from './components/MainPage'
import RegisterPage from './components/Authentication/RegisterPage'
import TestUpload from './components/TestUpload'

SetIP("http://localhost:5000")

const App = () => {
	const user = useSelector((state) => state.user)
	const dispatch = useDispatch()

	// eslint-disable-next-line
	useEffect(() => {
		ServerAPI_GET({
			url: "/islogin",
			onDataReceived: (data) => {
				console.log(data.isAuth)
				dispatch(setIsAuth(data.isAuth))
			} 
		}) // eslint-disable-next-line	
	}, [])

	return (
		<BrowserRouter>
			<Routes>
					<Route path="/" element={ 
						user.isAuth === undefined ? ( 
							<LoadingPage /> 
						) : ( 
							user.isAuth ? ( 
								<MainPage /> 
							) : (
								<LoginPage /> 
							) 
						) 
					} />
					<Route path="/register" element={ <RegisterPage /> } />
					<Route path="/upload" element={ <TestUpload /> } />
			</Routes>
			
		</BrowserRouter>
	);
}

export default App;
