import { createSlice } from '@reduxjs/toolkit'

export const userSlice = createSlice({
	name: 'user',
	initialState: {
		isAuth: undefined,
		data: undefined
	},
	reducers: {
		setIsAuth: (state, action) => {
			state.isAuth = action.payload
		},
		setName: (state, action) => {
			state.data = { name: action.payload }
		},
	},
})

// Action creators are generated for each case reducer function
export const { setIsAuth, setName } = userSlice.actions

export default userSlice.reducer