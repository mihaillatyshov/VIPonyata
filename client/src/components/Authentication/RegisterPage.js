import React, { useEffect } from 'react'
import { Form, Button } from 'react-bootstrap'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { ServerAPI_POST } from '../../libs/ServerAPI'
import { resetForm, setValidated, setMessage, setNickname, setPassword1, setPassword2, setName, setBirthday } from '../../redux/slices/registerSlice'

const RegisterPage = () => {
	const navigate = useNavigate()
	const register = useSelector((state) => state.register)
	const dispatch = useDispatch()

	useEffect(() => { 
		dispatch(resetForm()) // eslint-disable-next-line
	}, [])

	const handleSubmit = (event) => {
		event.preventDefault()
		event.stopPropagation()
		if (!(event.currentTarget.checkValidity() === false)) {
			ServerAPI_POST({
				url: "/register",
				body: {
					nickname: register.nickname,
					name: register.name,
					password1: register.password1,
					password2: register.password2,
					birthday: register.birthday
				},
				onDataReceived: (data) => {
					dispatch(resetForm())
					navigate("/")
				},
				handleStatus: (res) => {
					if (res.status === 422) {
						console.log(res)
						dispatch(setMessage(res.data.message))
					}
				}
			})
		}

		dispatch(setValidated())
	}

	const handleChangeNickname  = (e) => { dispatch(setNickname (e.target.value)) }
	const handleChangeName  	= (e) => { dispatch(setName 	(e.target.value)) }
	const handleChangePassword1 = (e) => { dispatch(setPassword1(e.target.value)) }
	const handleChangePassword2 = (e) => { dispatch(setPassword2(e.target.value)) }
	const handleChangeBirthday	= (e) => { dispatch(setBirthday (e.target.value)) }

	return (
		<div className='w-100 mx-auto'>
			<Form className="login_form_margin text-center mx-auto w-50" noValidate validated={register.validated} onSubmit={handleSubmit}>
				<Form.Group className="mt-4">
					<Form.Label> Имя </Form.Label>
					<Form.Control type="text" required value={register.name} onChange={handleChangeName} />
				</Form.Group>
				<Form.Group className="mt-4">
					<Form.Label> Никнейм </Form.Label>
					<Form.Control type="text" required value={register.nickname} onChange={handleChangeNickname} />
				</Form.Group>
				<Form.Group className="mt-4">
					<Form.Label> Пароль </Form.Label>
					<Form.Control type="password" required value={register.password1} onChange={handleChangePassword1} />
				</Form.Group>
				<Form.Group className="mt-4">
					<Form.Label> Подтвердите пароль </Form.Label>
					<Form.Control type="password" required value={register.password2} onChange={handleChangePassword2} />
				</Form.Group>
				<Form.Group className="mt-4">
					<Form.Label> День рождения </Form.Label>
					<Form.Control type="date" required value={register.birthday} onChange={handleChangeBirthday} />
				</Form.Group>
				<Form.Group className="mt-4">
					<Button variant="secondary" type="submit"> Зарегистрироваться </Button>
				</Form.Group>
				<Form.Group className="mt-4">
					<Link to="/"> Вход </Link>
				</Form.Group>
			</Form>
		</div>
	)
}

export default RegisterPage