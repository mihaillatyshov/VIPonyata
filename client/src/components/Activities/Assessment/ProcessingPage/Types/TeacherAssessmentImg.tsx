import React, { useEffect, useState } from "react";

import InputImage from "components/Form/InputImage";
import { LoadStatus } from "libs/Status";
import { TTeacherAssessmentImg } from "models/Activity/Items/TAssessmentItems";
import { ImageState } from "models/Img";

import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";

const TeacherAssessmentImg = ({ data, taskUUID, onChangeTask }: TeacherAssessmentTypeProps<TTeacherAssessmentImg>) => {
    const [img, setImg] = useState<ImageState>(
        data.url === "" ? { loadStatus: LoadStatus.NONE } : { loadStatus: LoadStatus.DONE, url: data.url },
    );

    useEffect(() => {
        setImg(data.url === "" ? { loadStatus: LoadStatus.NONE } : { loadStatus: LoadStatus.DONE, url: data.url });
    }, [data.url]);

    const setImgHandler = (imgState: ImageState) => {
        if (imgState.loadStatus === LoadStatus.DONE) {
            onChangeTask({ ...data, url: imgState.url });
        } else {
            setImg(imgState);
        }
    };

    return (
        <InputImage
            htmlId={taskUUID}
            placeholder="Картинка"
            className="mt-2"
            value={img}
            onChangeHandler={setImgHandler}
        />
    );
};

export default TeacherAssessmentImg;
