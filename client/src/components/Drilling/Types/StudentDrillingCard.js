import React, { useEffect } from 'react'
import { Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { LogError, LogInfo, LogWarn } from '../../../libs/Logger';
import { setDrillingSelectedItem, setDrillingSelectedItemField } from '../../../redux/slices/drillingSlice';

const StudentDrillingCard = ({ cards }) => {
	const { cardId } = useParams()
	const navigate = useNavigate()
	const dispatch = useDispatch()
	const card = useSelector((state) => state.drilling.selectedItem)

	const checkItem = () => {
		if (card)
		{
			if (card.type === "drillingcard") 
			{
				if (card.number === cardId)
				{
					return true
				}
			}	
		}
		return false
	}

	useEffect(() => {
		LogInfo("setDrillingSelectedItem card", cardId)
		if (cards)
		{
			if (cardId < cards.length && cardId >= 0)
			{
				dispatch(setDrillingSelectedItem({...cards[cardId], type : "drillingcard", isOpen : false, number : cardId }))
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
		dispatch(setDrillingSelectedItemField({ isOpen : !card.isOpen }))
	}

	return (
		<div className="taskCard">
			{
				checkItem() && (
					<div>
						<div>
							<div className="drillingCardImg">
								<img src={card.Word.ImgSrc ? card.Word.ImgSrc : ""} />
							</div>
							<div>
								{ card.Word.WordJP } { card.Word.RU }
							</div>
							<div>
								<Button variant="success" onClick={handleChangeIsOpen}> Показать подсказку </Button>
									{ card.isOpen ? card.Answer : card.Sentence}
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