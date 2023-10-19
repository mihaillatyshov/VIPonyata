import React, { useState } from "react";

import InputImage from "components/Form/InputImage";
import { AjaxPost } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { ImageState } from "models/Img";

interface DictionaryImageProps {
    initValue: string | null;
    className: string;
    dictionary_id: number;
    onSuccessSave: (association: string) => void;
}

const DictionaryImage = ({ initValue, className, dictionary_id, onSuccessSave }: DictionaryImageProps) => {
    const [img, setImg] = useState<ImageState>(
        initValue ? { loadStatus: LoadStatus.DONE, url: initValue } : { loadStatus: LoadStatus.NONE }
    );

    const uploadImg = (newImg: ImageState) => {
        if (newImg.loadStatus === LoadStatus.DONE) {
            AjaxPost({ url: `/api/dictionary/${dictionary_id}/img`, body: { url: newImg.url } })
                .then(() => {
                    setImg(newImg);
                    onSuccessSave(newImg.url);
                })
                .catch(() => {
                    setImg({ ...img, loadStatus: LoadStatus.ERROR });
                });
        } else {
            setImg(newImg);
        }
    };

    return (
        <InputImage
            className={className}
            htmlId="card_img"
            value={img}
            onChangeHandler={uploadImg}
            placeholder="card_img"
        />
    );
};

export default DictionaryImage;
