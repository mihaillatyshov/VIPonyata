import React, { useEffect } from "react"
import { Button } from "react-bootstrap"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"
import { LogInfo, LogWarn, LogError } from "libs/Logger"
import { setDrillingSelectedItem, setDrillingSelectedItemField } from "redux/slices/drillingSlice"

const StudentDrillingCard = ({ cards }) => {
	const { cardId } = useParams()
	const navigate = useNavigate()
	const dispatch = useDispatch()
	const item = useSelector((state) => state.drilling.selectedItem)
	const taskTypeName = "drillingcard"
	var synth = window.speechSynthesis;

	const sayJP = (sentence) => {
		const voices = synth.getVoices()
		LogInfo(voices)
		const result = voices.filter(voice => voice.lang === "ja-JP")
		LogInfo(result)
		var utterance = new SpeechSynthesisUtterance(sentence);
		utterance.lang = "ja-JP";
		//utterance.voice = result2[0];
		speechSynthesis.speak(utterance);
	}

	const checkItem = () => {
		if (item)
		{
			if (item.type === taskTypeName) 
			{
				if (item.number === cardId)
				{
					return true
				}
			}	
		}
		return false
	}

	useEffect(() => {
		LogInfo("setDrillingSelectedItem Card", cardId)
		if (cards)
		{
			if (cardId < cards.length && cardId >= 0)
			{
				dispatch(setDrillingSelectedItem({...cards[cardId], type : taskTypeName, isOpen : false, number : cardId }))
			}
		}
	}, [cardId])

	const handleButtonNavigate = (newId) => {
		if (newId < cards.length && newId >= 0)
		{
			navigate(`../drillingcard/${newId}`)
		}
	}

	const handleChangeIsOpen = () => {
		dispatch(setDrillingSelectedItemField({ isOpen : !item.isOpen }))
	}

	return (
		<div className="taskCard">
			{
				checkItem() && (
					<div>
						<div>
							<div className="drillingCardImg">
								<img src={item.Word.ImgSrc ? item.Word.ImgSrc : ""} />
							</div>
							<div>
								{ item.Word.WordJP } { item.Word.RU }
							</div>
							<div>
								<Button variant="success" onClick={handleChangeIsOpen}> Показать подсказку </Button>
									{ item.isOpen ? item.Answer : item.Sentence}
								<Button variant="success" onClick={()=>sayJP(item.Sentence)}> Say </Button>

							</div>
							<div>
								<Button variant="success" onClick={()=>sayJP(item.Word.WordJP)}> Say </Button>
							</div>
						</div>
					</div>
				)
			}
			<div>  </div>
			<Button type="button" onClick={() => handleButtonNavigate(parseInt(cardId) - 1)}> Предыдущая карточка </Button>
			<Button type="button" onClick={() => handleButtonNavigate(parseInt(cardId) + 1)}> Следующая карточка </Button>
		</div>
	)
}

export default StudentDrillingCard