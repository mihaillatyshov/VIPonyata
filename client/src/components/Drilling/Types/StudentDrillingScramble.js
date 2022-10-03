import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { LogInfo } from '../../../libs/Logger';
import { setDrillingSelectedItem, setDrillingSelectedItemField } from '../../../redux/slices/drillingSlice';
import { Button } from 'react-bootstrap';

const StudentDrillingScramble = ({ scrambles }) => {
	const dispatch = useDispatch()
	const item = useSelector((state) => state.drilling.selectedItem)
	const taskTypeName = "drillingscramble"

	const setNewWord = (id) => {
		let newDoneWord = []
		for (let i = 0; i < scrambles.chars[id].length; i++) {
			newDoneWord.push("⠀")
		}
		LogInfo(newDoneWord)

		dispatch(setDrillingSelectedItem({ ...scrambles, type: taskTypeName, wordId: id, usedChars: scrambles.chars[id], doneWord: newDoneWord, message : "Собери слово!" }))
	}

	useEffect(() => {
		LogInfo("setDrillingSelectedItem Scrambe")
		if (scrambles) {
			LogInfo(scrambles)
			setNewWord(0)
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

	const doneWordClick = (id) => {
		if (item.doneWord[id] !== "⠀") {
			let newDoneWord = [...item.doneWord]
			let newUsedChars = [...item.usedChars, newDoneWord[id]]
			newDoneWord[id] = "⠀"
			dispatch(setDrillingSelectedItemField({doneWord : newDoneWord, usedChars : newUsedChars}))
		}
	}

	const usedCharsClick = (id) => {
		let newUsedChars = [...item.usedChars]
		let newDoneWord = [...item.doneWord]
		for (let i = 0; i < newDoneWord.length; i++) {
			if (newDoneWord[i] === "⠀") {
				newDoneWord[i] = newUsedChars[id]
				break
			}
		}
		newUsedChars.splice(id, 1);
		dispatch(setDrillingSelectedItemField({doneWord : newDoneWord, usedChars : newUsedChars}))

		for (let i = 0; i < newDoneWord.length; i++) {
			LogInfo("NDW", newDoneWord, item.words[item.wordId][i])
			if (newDoneWord[i] !== item.words[item.wordId][i]) {
				return
			}
		}
		// if last word, save changes and go to hub
		setNewWord(item.wordId + 1)
		
	}

	return (
		<div>
			{
				checkItem() && (
					<div>
						<div>
							<div> {item.nowId} </div>
							<div>
								{
									item.doneWord.map((item, key) => (
										<Button className="scrambleItem" key={key} variant="outline-dark" onClick={() => doneWordClick(key)}> { item } </Button>
									))
								}
							</div>
							<div>
								{
									item.usedChars.map((item, key) => (
										<Button className="scrambleItem" key={key} variant="outline-dark" onClick={() => usedCharsClick(key)}> { item } </Button>
									))
								}
							</div>
							<div> {item.words[item.wordId]} </div>
							<div> {item.message} </div>
						</div>
					</div>
				)
			}
		</div>
	)
}

export default StudentDrillingScramble