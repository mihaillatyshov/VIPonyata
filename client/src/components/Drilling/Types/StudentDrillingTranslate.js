import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { LogInfo } from '../../../libs/Logger';
import { setDrillingSelectedItem, setDrillingSelectedItemField } from '../../../redux/slices/drillingSlice';
import { Button } from 'react-bootstrap';

const StudentDrillingTranslate = ({ words }) => {
	const dispatch = useDispatch()
	const item = useSelector((state) => state.drilling.selectedItem)
	const taskTypeName = "drillingtranslate"

	useEffect(() => {
		LogInfo("setDrillingSelectedItem Scrambe")
		if (words) {
			LogInfo(words)
			dispatch(setDrillingSelectedItem({ ...words, type: taskTypeName, wordId: 0, inputText : "" }))
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
		dispatch(setDrillingSelectedItemField({ inputText : e.target.value }))
	}

	const nextWord = () => {
		LogInfo(item.WordsRU, item.inputText.trim())
		if (item.WordsRU[item.wordId] === item.inputText.trim())
			dispatch(setDrillingSelectedItemField({ wordId : item.wordId + 1, inputText : "" }))
	}

	return (
		<div>
			{
				checkItem() && (
					<div>
						<div>
							<div>
								{ item.WordsJP[item.wordId] }
							</div>
							<div>
								<input type="text" value={item.inputText} onChange={handleTextChange}/>
								<Button onClick={nextWord}> Next </Button>
							</div>
						</div>
					</div>
				)
			}
		</div>
	)
}

export default StudentDrillingTranslate