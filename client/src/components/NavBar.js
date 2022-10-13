import React from "react"
import StudentProfile from "./Authentication/StudentProfile"
import StudentDictionary from "./Dictionary/StudentDictionary"

const NavBar = () => {
	return (
		<div className="container mainNavBar">
			<div className="row justify-content-center">
				<StudentProfile />
				<StudentDictionary />
				<div className="col-auto" style={{ minWidth: "300px", border: "solid 1px" }}>
					Notifications and etc
				</div>
			</div>
		</div>
	)
}

export default NavBar