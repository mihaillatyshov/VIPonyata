import React from 'react'
import { useSelector } from 'react-redux'

const StudentProfile = () => {
	const user = useSelector((state) => state.user)

	return (
		<div className="col-auto mx-2" style={{ border: "solid 1px" }}>
			<div className="d-flex">
				<img className="profile" src={user.data.avatar === null ? "/img/users/DefaultAvatar.png" : user.data.avatar} />
				<div>
					<div className="mx-auto"> {user.data.name} </div>
					<div> {user.data.nickname} </div>
				</div>
			</div>
		</div>
	)
}

export default StudentProfile