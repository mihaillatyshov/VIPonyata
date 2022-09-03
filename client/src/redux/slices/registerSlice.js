import { createSlice } from '@reduxjs/toolkit'

const initialState = {
	validated: false,
	message: '',
	nickname: '',
	password1: '',
	password2: '',
	name: '',
	birthday: ''
}

export const registerSlice = createSlice({
	name: 'register',
	initialState: initialState,
	reducers: {
		resetForm: (state) => { // eslint-disable-next-line
			Object.keys(initialState).map(val => {
				state[val] = initialState[val]
			})
		},
		setValidated: (state) => {
			state.validated = true
		},
		setMessage: (state, action) => {
			state.message = action.payload
		},
		setNickname: (state, action) => {
			state.nickname = action.payload
		},
		setPassword1: (state, action) => {
			state.password1 = action.payload
		},
		setPassword2: (state, action) => {
			state.password2 = action.payload
		},
		setName: (state, action) => {
			state.name = action.payload
		},
		setBirthday: (state, action) => {
			state.birthday = action.payload
		},
	},
})

// Action creators are generated for each case reducer function
export const { resetForm, setValidated, setMessage, setNickname, setPassword1, setPassword2, setName, setBirthday } = registerSlice.actions

export default registerSlice.reducer