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
		resetForm: (state) => { // eslint-disable-next-line
			Object.keys(initialState).map(val => {
				state[val] = initialState[val]
			})
		},
		setValidated: (state) => {
			state.validated = true
		},
		setNickname: (state, action) => {
			state.nickname = action.payload
		},
		setPassword: (state, action) => {
			state.password = action.payload
		},
	},
})

// Action creators are generated for each case reducer function
export const { resetForm, setValidated, setNickname, setPassword } = loginSlice.actions

export default loginSlice.reducer