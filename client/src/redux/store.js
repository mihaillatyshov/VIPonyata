import { configureStore } from '@reduxjs/toolkit'
import counterReducer from './slices/counterSlice'
import userReducer from './slices/userSlice'
import loginReducer from './slices/loginSlice'
import registerSlice from './slices/registerSlice'

export default configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
	login: loginReducer,
	register: registerSlice 
  },
})