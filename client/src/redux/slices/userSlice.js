import { createSlice } from '@reduxjs/toolkit'

export const userSlice = createSlice({
	name: 'user',
	initialState: {
		isAuth: undefined,
		data: undefined
	},
	reducers: {
		setUserData: (state, action) => {
			state.isAuth = action.payload.isAuth
			state.data = action.payload.userData
		}
	},
})

export const { setUserData } = userSlice.actions

export default userSlice.reducer