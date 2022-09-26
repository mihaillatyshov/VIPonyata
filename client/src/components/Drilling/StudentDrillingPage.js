import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ServerAPI_GET } from '../../libs/ServerAPI';
import { decDrillingTimeRemaining, setDrillingInfo, setDrillingItems } from '../../redux/slices/drillingSlice';
import StudentDrillingNav from './Nav/StudentDrillingNav';
import StudentDrillingCard from './Types/StudentDrillingCard';
import StudentDrillingFindPair from './Types/StudentDrillingFindPair';
import NavigateToElement from '../NavigateToElement';
import StudentDrillingTimeRemaining from './StudentDrillingTimeRemaining';

const StudentDrillingPage = () => {
	const { id } = useParams()
	const navigate = useNavigate()
	const dispatch = useDispatch()
	const drilling = useSelector((state) => state.drilling)

	useEffect(() => {
		dispatch(setDrillingInfo(undefined))
		ServerAPI_GET({
			url: `/api/drilling/${id}`,
			onDataReceived: (data) => {
				dispatch(setDrillingInfo(data.drilling))
				dispatch(setDrillingItems(data.items))
			},
			handleStatus: (res) => {
				if (res.status === 403)
					navigate("/")
			}
		})
	}, [])

	return (
		<div>
			{
				drilling.info ? (drilling.info.try && (
					<div>
						<div> {drilling.info.Description} {drilling.info.TimeLimit} {drilling.info.try.StartTime} </div>
						<StudentDrillingTimeRemaining />
						<StudentDrillingNav items={drilling.items}/>
						<Routes>
							<Route path="/drillingcard/:cardId" element={ <StudentDrillingCard cards={ drilling.items.drillingcard } /> } />
							<Route path="/drillingcard" element={ <NavigateToElement to="../drillingcard/0" /> } />
							<Route path="/drillingfindpair" element={ <StudentDrillingFindPair pairs={ drilling.items.drillingfindpair } /> } />
						</Routes>
						<div>
							tasks block
						</div>
					</div>
				)) : (
					<div> Loading... </div>
				)
			}

		</div>
	)
}

export default StudentDrillingPage