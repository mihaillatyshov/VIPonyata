import React, { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Form, Button } from "react-bootstrap"
import { Link } from "react-router-dom"
import { resetLoginForm, setLoginNickname, setLoginPassword, setLoginValidated } from "redux/slices/loginSlice"
import { ServerAPI_POST } from "libs/ServerAPI"
import { setUserData } from "redux/slices/userSlice"

const LoginPage = () => {
	const login = useSelector((state) => state.login)
	const dispatch = useDispatch()

	useEffect(() => {
		dispatch(resetLoginForm()) // eslint-disable-next-line
	}, [])

	const handleSubmit = (event) => {
		event.preventDefault()
		event.stopPropagation()
		if (!(event.currentTarget.checkValidity() === false)) {
			ServerAPI_POST({
				url: "/api/login",
				body: {
					nickname: login.nickname,
					password: login.password
				},
				onDataReceived: (data) => {
					dispatch(setUserData(data))
					dispatch(resetLoginForm())
				}
			})
		}

		dispatch(setLoginValidated())
	}

	const handleChangeNickname = (e) => { dispatch(setLoginNickname(e.target.value)) }
	const handleChangePassword = (e) => { dispatch(setLoginPassword(e.target.value)) }

	return (
		<div className="w-100 mx-auto">
			<Form className="login_form_margin text-center mx-auto w-50" noValidate validated={login.validated} onSubmit={handleSubmit}>
				<Form.Group className="mt-4">
					<Form.Label> Никнейм </Form.Label>
					<Form.Control type="text" required value={login.nickname} onChange={handleChangeNickname} />
				</Form.Group>
				<Form.Group className="mt-4">
					<Form.Label> Пароль	</Form.Label>
					<Form.Control type="password" required value={login.password} onChange={handleChangePassword} />
				</Form.Group>
				<Form.Group className="mt-4">
					<Button variant="secondary" type="submit"> Войти </Button>
				</Form.Group>
				<Form.Group className="mt-4">
					<Link to="/register"> Регистрация </Link>
				</Form.Group>
			</Form>
		</div>
	)
}

export default LoginPage