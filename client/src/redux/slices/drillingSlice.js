import { createSlice } from '@reduxjs/toolkit'

const initialState = {
	info: undefined,
	items : undefined,
	selectedItem : undefined
}

export const drillingSlice = createSlice({
	name: 'drilling',
	initialState: initialState,
	reducers: {
		setDrillingInfo: (state, action) => {
			state.info = action.payload
		},
		setDrillingItems: (state, action) => {
			state.items = action.payload
		},
		decDrillingTimeRemaining: (state) => {
			if (state.info) {
				if (state.info.TimeRemaining) {
					state.info.TimeRemaining -= 1
				}
			}
		},
		setDrillingSelectedItem : (state, action) => {
			state.selectedItem = action.payload
		},
		setDrillingSelectedItemField : (state, action) => {
			for (const key in action.payload)
				state.selectedItem[key] = action.payload[key]
		} 
	},
})

export const { setDrillingInfo, decDrillingTimeRemaining, setDrillingItems, setDrillingSelectedItem, setDrillingSelectedItemField } = drillingSlice.actions

export default drillingSlice.reducer