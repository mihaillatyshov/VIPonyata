import React, { useEffect } from "react";
import { Button } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { LogInfo } from "libs/Logger";
import { selectDrilling, setDrillingSelectedItem, setDrillingSelectedItemField } from "redux/slices/drillingSlice";
import style from "../StyleDrilling.module.css";
import { StudentDrillingTaskProps } from "./StudentDrillingTaskInterface";
import { useAppDispatch, useAppSelector } from "redux/hooks";

const StudentDrillingCard = ({ name, inData, goToNextTaskCallback }: StudentDrillingTaskProps) => {
    const { cardId } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const item = useAppSelector(selectDrilling).selectedItem;
    const taskTypeName = "card";
    var synth = window.speechSynthesis;

    const sayJP = (sentence: string) => {
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
                if (item.number === Number(cardId)) {
                    return true;
                }
            }
        }
        return false;
    };

    const isFirstCard = () => {
        return item.number === 0;
    };

    useEffect(() => {
        LogInfo("setDrillingSelectedItem Card", cardId);
        if (inData && cardId) {
            if (Number(cardId) < inData.length && Number(cardId) >= 0) {
                dispatch(
                    setDrillingSelectedItem({
                        ...inData[cardId],
                        type: taskTypeName,
                        isOpen: false,
                        number: Number(cardId),
                    })
                );
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cardId]);

    const handleButtonNavigate = (newId: number) => {
        if (newId === inData.length) {
            goToNextTaskCallback(taskTypeName, 0);
        }
        if (newId < inData.length && newId >= 0) {
            navigate(`../card/${newId}`);
        }
    };

    const handleChangeIsOpen = () => {
        dispatch(setDrillingSelectedItemField({ isOpen: !item.isOpen }));
    };

    if (!checkItem()) {
        return <div> Loading . . . </div>;
    }

    return (
        <div className={style.drillingCard}>
            <div className="row">
                <div className="col-auto">
                    <div className={style.drillingCardDiv}>
                        <div className={style.drillingCardWords}>
                            <div>
                                {item.word.word_jp}
                                <Button variant="success" onClick={() => sayJP(item.word.word_jp)}>
                                    {" "}
                                    Say{" "}
                                </Button>
                            </div>
                            <div>{item.word.ru}</div>
                        </div>
                        <div className={style.drillingCardSentence}>
                            <div>
                                {item.sentence}
                                <Button variant="success" onClick={() => sayJP(item.sentence)}>
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
                                {item.isOpen ? item.answer : "(. . .)"}
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
                        <img src={item.word.img ? item.word.img : ""} className={style.drillingCardImg} alt="" />
                    </div>
                </div>
            </div>
            <div>
                <Button
                    type="button"
                    onClick={() => handleButtonNavigate(Number(cardId) - 1)}
                    disabled={isFirstCard() ? true : false}
                >
                    {" "}
                    Предыдущая карточка{" "}
                </Button>
                <Button type="button" onClick={() => handleButtonNavigate(Number(cardId) + 1)}>
                    {" "}
                    Следующая карточка{" "}
                </Button>
            </div>
        </div>
    );
};

export default StudentDrillingCard;
