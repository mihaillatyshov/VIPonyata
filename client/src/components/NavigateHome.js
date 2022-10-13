import React, { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import LoadingPage from "./LoadingPage"

const NavigateHome = () => {
	const navigate = useNavigate()
	useEffect(() => {
		navigate("/")
	})
	console.log("navigate")
	return (
		<LoadingPage />
	)
}

export default NavigateHome