import { createSlice } from '@reduxjs/toolkit'

const initialState = {
	validated: false,
	nickname: '',
	password: ''
}

export const loginSlice = createSlice({
	name: 'login',
	initialState: initialState,
	reducers: {
		resetLoginForm: (state) => { // eslint-disable-next-line
			Object.keys(initialState).map(val => {
				state[val] = initialState[val]
			})
		},
		setLoginValidated: (state) => {
			state.validated = true
		},
		setLoginNickname: (state, action) => {
			state.nickname = action.payload
		},
		setLoginPassword: (state, action) => {
			state.password = action.payload
		},
	},
})

export const { resetLoginForm, setLoginValidated, setLoginNickname, setLoginPassword } = loginSlice.actions

export default loginSlice.reducer