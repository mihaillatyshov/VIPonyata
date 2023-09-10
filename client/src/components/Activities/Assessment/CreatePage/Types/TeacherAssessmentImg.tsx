import React, { useEffect, useState } from "react";
import { TTeacherAssessmentImg } from "models/Activity/Items/TAssessmentItems";
import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";
import InputImage from "components/Form/InputImage";
import { ImageState } from "models/Img";
import { LoadStatus } from "libs/Status";

const TeacherAssessmentImg = ({ data, taskId, onChangeTask }: TeacherAssessmentTypeProps<TTeacherAssessmentImg>) => {
    const [img, setImg] = useState<ImageState>({ loadStatus: LoadStatus.NONE });

    useEffect(() => {
        if (img.loadStatus === LoadStatus.DONE) {
            onChangeTask(taskId, { ...data, url: img.url });
        } else {
            onChangeTask(taskId, { ...data, url: "" });
        }
    }, [img.loadStatus]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <InputImage
            htmlId="course-image"
            placeholder="Картинка"
            className="mt-2"
            value={img}
            onChangeHandler={setImg}
        />
    );
};

export default TeacherAssessmentImg;
