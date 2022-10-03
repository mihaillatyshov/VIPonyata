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
import StudentDrillingScramble from './Types/StudentDrillingScramble';
import { LogInfo } from '../../libs/Logger';
import StudentDrillingTranslate from './Types/StudentDrillingTranslate';
import StudentDrillingSpace from './Types/StudentDrillingSpace';

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
				LogInfo(data)
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
						{
							drilling.info.Deadline ? (
								<StudentDrillingTimeRemaining />
							) : (
								<div> </div>
							)
						}
						< StudentDrillingNav items={drilling.items} />
						<Routes>
							<Route path="/drillingcard" element={<NavigateToElement to="../drillingcard/0" />} />
							<Route path="/drillingcard/:cardId" element={<StudentDrillingCard cards={drilling.items.drillingcard} />} />
							<Route path="/drillingfindpair" element={<StudentDrillingFindPair pairs={drilling.items.drillingfindpair} />} />
							<Route path="/drillingscramble" element={<StudentDrillingScramble scrambles={drilling.items.drillingscramble} />} />
							<Route path="/drillingtranslate" element={<StudentDrillingTranslate words={drilling.items.drillingtranslate} />} />
							<Route path="/drillingspace" element={<StudentDrillingSpace spaces={drilling.items.drillingspace} />} />
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