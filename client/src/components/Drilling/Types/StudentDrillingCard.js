import React, { useEffect } from "react";
import { Button } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { LogInfo, LogWarn, LogError } from "libs/Logger";
import { setDrillingSelectedItem, setDrillingSelectedItemField } from "redux/slices/drillingSlice";
import style from "../StyleDrilling.module.css";

const StudentDrillingCard = ({ cards }) => {
    const { cardId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const item = useSelector((state) => state.drilling.selectedItem);
    const taskTypeName = "drillingcard";
    var synth = window.speechSynthesis;

    const sayJP = (sentence) => {
        const voices = synth.getVoices();
        LogInfo(voices);
        const result = voices.filter((voice) => voice.lang === "ja-JP");
        LogInfo(result);
        var utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = "ja-JP";
        //utterance.voice = result2[0];
        speechSynthesis.speak(utterance);
    };

    const checkItem = () => {
        if (item) {
            if (item.type === taskTypeName) {
                if (item.number === cardId) {
                    return true;
                }
            }
        }
        return false;
    };

    const isFirstCard = () => {
        return item.number === 0;
    };

    const isLastCard = () => {};

    useEffect(() => {
        LogInfo("setDrillingSelectedItem Card", cardId);
        if (cards) {
            if (cardId < cards.length && cardId >= 0) {
                dispatch(
                    setDrillingSelectedItem({ ...cards[cardId], type: taskTypeName, isOpen: false, number: cardId })
                );
            }
        }
    }, [cardId]);

    const handleButtonNavigate = (newId) => {
        if (newId < cards.length && newId >= 0) {
            navigate(`../drillingcard/${newId}`);
        }
    };

    const handleChangeIsOpen = () => {
        dispatch(setDrillingSelectedItemField({ isOpen: !item.isOpen }));
    };

    return (
        <div className={style.drillingCard}>
            {checkItem() && (
                <div className="row">
                    <div className="col-auto">
                        <div className={style.drillingCardDiv}>
                            <div className={style.drillingCardWords}>
                                <div>
                                    {item.Word.WordJP}
                                    <Button variant="success" onClick={() => sayJP(item.Word.WordJP)}>
                                        {" "}
                                        Say{" "}
                                    </Button>
                                </div>
                                <div>{item.Word.RU}</div>
                            </div>
                            <div className={style.drillingCardSentence}>
                                <div>
                                    {item.Sentence}
                                    <Button variant="success" onClick={() => sayJP(item.Sentence)}>
                                        {" "}
                                        Say{" "}
                                    </Button>
                                </div>
                                <div>
                                    <Button variant="success" onClick={handleChangeIsOpen}>
                                        {" "}
                                        Показать подсказку{" "}
                                    </Button>
                                    <br />
                                    {item.isOpen ? item.Answer : "(. . .)"}
                                    <div></div>
                                </div>
                            </div>
                            <div>
                                {"Твоя ассоциация к слову: "}
                                <input type="text" />
                            </div>
                        </div>
                    </div>
                    <div className="col-auto">
                        <div className={style.drillingCardImgDiv}>
                            <img src={item.Word.ImgSrc ? item.Word.ImgSrc : ""} className={style.drillingCardImg} />
                        </div>
                    </div>
                </div>
            )}
            <div className={style.clearFloat}></div>
            <Button type="button" onClick={() => handleButtonNavigate(parseInt(cardId) - 1)}>
                {" "}
                Предыдущая карточка{" "}
            </Button>
            <Button type="button" onClick={() => handleButtonNavigate(parseInt(cardId) + 1)}>
                {" "}
                Следующая карточка{" "}
            </Button>
        </div>
    );
};

export default StudentDrillingCard;
