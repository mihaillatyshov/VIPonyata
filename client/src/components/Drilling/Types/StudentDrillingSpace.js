import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { LogInfo } from '../../../libs/Logger';
import { setDrillingSelectedItem, setDrillingSelectedItemField } from '../../../redux/slices/drillingSlice';
import { Button } from 'react-bootstrap';

const StudentDrillingSpace = ({ spaces }) => {
	const dispatch = useDispatch()
	const item = useSelector((state) => state.drilling.selectedItem)
	const taskTypeName = "drillingspace"

	useEffect(() => {
		LogInfo("setDrillingSelectedItem Space")
		if (spaces) {
			LogInfo(spaces)
			dispatch(setDrillingSelectedItem({ ...spaces, type: taskTypeName, wordId: 0 }))
		}
	}, [])

	const checkItem = () => {
		if (item) {
			if (item.type === taskTypeName) {
				return true
			}
		}
		return false
	}

	const handleTextChange = (e) => {
		dispatch(setDrillingSelectedItemField({ inputText: e.target.value }))
	}

	const nextWord = () => {
		LogInfo(item.WordsRU, item.inputText.trim())
		if (item.WordsRU[item.wordId] === item.inputText.trim())
			dispatch(setDrillingSelectedItemField({ wordId: item.wordId + 1, inputText: "" }))
	}

	return (
		<div>
			{
				checkItem() && (
					<div>
						<div>
							<div>
							</div>
							<div>
								<div className="input-group my-3">
									<div className="input-group-prepend">
										<span className="input-group-text" id="inputGroup-sizing-default">
											{item.Words[item.wordId].WordStart === "" ? "⠀" : item.Words[item.wordId].WordStart}
										</span>
									</div>
									<input type="text" className="form-control" aria-label="Default" aria-describedby="inputGroup-sizing-default" />
									<div className="input-group-append">
										<span className="input-group-text" id="inputGroup-sizing-default">
											{item.Words[item.wordId].WordEnd === "" ? "⠀" : item.Words[item.wordId].WordEnd}
										</span>
									</div>
								</div>
								<Button onClick={nextWord}> Next </Button>
							</div>
						</div>
					</div>
				)
			}
		</div>
	)
}

export default StudentDrillingSpace