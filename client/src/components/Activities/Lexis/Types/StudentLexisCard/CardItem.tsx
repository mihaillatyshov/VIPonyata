import React, { useState } from "react";

import DictionaryAssociation from "components/Dictionary/DictionaryAssociation";
import DictionaryImage from "components/Dictionary/DictionaryImage";
import { TSingleCardItem } from "models/Activity/Items/TLexisItems";

import styles from "../../StyleLexis.module.css";

interface CardItemProps {
    data: TSingleCardItem;
    isFirst: boolean;
    isLast: boolean;
    openNextCardOrDone: () => void;
    openPrevCard: () => void;
    setLexisCardImg: (img: string) => void;
    setLexisCardAssociation: (association: string) => void;
    aliasJP: "word_jp" | "char_jp";
}

const CardItem = ({
    data,
    isFirst,
    isLast,
    openNextCardOrDone,
    openPrevCard,
    setLexisCardImg,
    setLexisCardAssociation,
    aliasJP,
}: CardItemProps) => {
    const [isAnswerOpen, setIsAnswerOpen] = useState(false);

    const handleChangeIsAnswerOpen = () => setIsAnswerOpen(!isAnswerOpen);

    // const synth = window.speechSynthesis;
    const sayJP = (sentence: string) => {
        // const voices = synth.getVoices();
        // const result = voices.filter((voice) => voice.lang === "ja-JP");
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = "ja-JP";
        speechSynthesis.speak(utterance);
    };

    return (
        <div className={`my-card ${styles.lexisCard}`}>
            <div className="row mb-auto">
                <div className="col-auto h-100">
                    <div className={styles.lexisCardDiv}>
                        <div className={`mb-4 ${styles.lexisCardWord}`}>
                            <div className="d-flex align-content-center align-items-center">
                                <div>{data.word[aliasJP]}</div>
                                <i
                                    className="d-flex bi bi-volume-up ms-2 font-icon-button"
                                    onClick={() => sayJP(data.word[aliasJP])}
                                    style={{ fontSize: "1.5em" }}
                                />
                            </div>
                            <div>{data.word.ru}</div>
                        </div>
                        <div className="d-flex align-content-center align-items-center">
                            <div>{data.sentence}</div>
                            <i
                                className="d-flex bi bi-volume-up ms-2 font-icon-button"
                                onClick={() => sayJP(data.sentence)}
                                style={{ fontSize: "1.5em" }}
                            />
                        </div>
                        <div className={`mb-4 ${styles.lexisCardAnswer}`}>
                            {isAnswerOpen ? (
                                data.answer
                            ) : (
                                <input
                                    type="button"
                                    className="btn btn-success btn-sm"
                                    onClick={handleChangeIsAnswerOpen}
                                    value="Показать подсказку"
                                />
                            )}
                        </div>
                        <div>
                            <div>Твоя ассоциация к слову:</div>
                            <DictionaryAssociation
                                initValue={data.word.association}
                                dictionary_id={data.dictionary_id}
                                onSuccessSave={setLexisCardAssociation}
                            />
                        </div>
                    </div>
                </div>
                <div className="col-auto">
                    <DictionaryImage
                        initValue={data.word.img}
                        className={styles.lexisCardImgDiv}
                        dictionary_id={data.dictionary_id}
                        onSuccessSave={setLexisCardImg}
                    />
                </div>
            </div>
            <div className="d-flex flex-wrap justify-content-between ">
                <input
                    type="button"
                    className="btn btn-secondary mt-2"
                    onClick={openPrevCard}
                    disabled={isFirst}
                    value="Предыдущая карточка"
                />
                <input
                    type="button"
                    className="btn btn-success mt-2"
                    onClick={openNextCardOrDone}
                    value="Следующая карточка"
                />
            </div>
        </div>
    );
};

export default CardItem;
