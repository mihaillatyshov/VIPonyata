import React, { useEffect, useState } from "react";
import { TCreateCardItem } from "models/Activity/Items/TLexisItems";
import { TDictionaryItem } from "models/TDictionary";
import InputImage from "components/Form/InputImage";
import { ImageState } from "models/Img";
import { LoadStatus } from "libs/Status";

import styles from "./StylesCreatePage.module.css";
import InputTextArea from "components/Form/InputTextArea";

interface CreatePageLexisCardProps {
    dict: TDictionaryItem;
    card: TCreateCardItem;
    setDictImg: (url: string | null, setError: () => void) => void;
    setCardData: (value: string, fieldName: "sentence" | "answer") => void;
}

const CreatePageLexisCard = ({ dict, card, setDictImg, setCardData }: CreatePageLexisCardProps) => {
    const [img, setImg] = useState<ImageState>(
        dict.img === null ? { loadStatus: LoadStatus.NONE } : { loadStatus: LoadStatus.DONE, url: dict.img }
    );

    useEffect(() => {
        setImg(dict.img === null ? { loadStatus: LoadStatus.NONE } : { loadStatus: LoadStatus.DONE, url: dict.img });
    }, [dict.img]);

    const setImgHandler = (imgState: ImageState) => {
        if (imgState.loadStatus === LoadStatus.DONE) {
            setDictImg(imgState.url, () => setImg({ loadStatus: LoadStatus.ERROR }));
        } else {
            setImg(imgState);
        }
    };

    return (
        <div className="my-card">
            <div className="row">
                <div className="col-6">
                    <InputImage
                        htmlId={`card_img_${dict.id}`}
                        placeholder="Картинка"
                        value={img}
                        onChangeHandler={setImgHandler}
                    />
                </div>
                <div className="col-6 d-flex flex-column justify-content-center">
                    <div className={`${styles.cardTableRow}`}>
                        <div className={styles.cardTableCell}>Перевод</div>
                        <div className={styles.cardTableCell}>{dict.ru}</div>
                    </div>
                    <div className={`${styles.cardTableRow}`}>
                        <div className={styles.cardTableCell}>Слово</div>
                        <div className={styles.cardTableCell}>{dict.word_jp}</div>
                    </div>
                    <div className={`${styles.cardTableRow}`}>
                        <div className={styles.cardTableCell}>Символ</div>
                        <div className={styles.cardTableCell}>{dict.char_jp}</div>
                    </div>
                </div>
            </div>
            <div>
                {
                    // TODO
                }
                <InputTextArea
                    htmlId={`card_sentence_${dict.id}`}
                    value={card.sentence}
                    onChangeHandler={(value) => setCardData(value, "sentence")}
                    placeholder="Предложение на японском"
                    rows={5}
                />
                {
                    // TODO
                }
                <InputTextArea
                    htmlId={`card_answer_${dict.id}`}
                    value={card.answer}
                    onChangeHandler={(value) => setCardData(value, "answer")}
                    placeholder="Перевод японского предложения"
                    rows={5}
                />
            </div>
            <div></div>
        </div>
    );
};

export default CreatePageLexisCard;
