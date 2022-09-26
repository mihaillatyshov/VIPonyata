import React, { useEffect } from 'react'
import { Card } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import { LogInfo, MD5 } from '../../../libs/Logger'
import { setDrillingSelectedItem } from '../../../redux/slices/drillingSlice'


const StudentDrillingFindPair = ({ pairs }) => {
	const dispatch = useDispatch()
	const pair = useSelector((state) => state.drilling.selectedItem)

	const checkItem = () => {
		if (pair) {
			if (pair.type === "drillingfindpair") {
				return true
			}
		}
		return false
	}

	useEffect(() => {
		LogInfo("setDrillingSelectedItem find pair")
		if (pairs) {
			LogInfo(pairs)
			dispatch(setDrillingSelectedItem({ ...pairs, type: "drillingfindpair" }))
		}
	}, [])

	return (
		<div>
			{
				checkItem() ? (
					<div className="container">
						<div className="row">
							<div className="col-6">
								<div className="container">
									<div className="row justify-content-end">
										{
											pair.JP.map((value, key) => (
												<Card className="col-auto" key={key} style={{ height: '100%' }}>
													{value}
												</Card>
											))
										}
									</div>
								</div>
							</div>

							<div className="col-6">
								<div className="container">
									<div className="row">
										{
											pair.RU.map((value, key) => (
												<Card className="col-auto" key={key} style={{ height: '100%' }}>
													{value}
												</Card>
											))
										}
									</div>
								</div>
							</div>
						</div>
					</div>
				) : (
					<div> </div>
				)
			}
			<div>StudentDrillingFindPair</div>
		</div>
	)
}

export default StudentDrillingFindPair