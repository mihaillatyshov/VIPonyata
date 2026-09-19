import { useEffect, useState } from "react";

import { AssessmentImgContent } from "components/Activities/Assessment/AssessmentImgContent";
import { FloatingLabelTextareaAutosize } from "components/Form/FloatingLabelTextareaAutosize";
import InputImage from "components/Form/InputImage";
import { LoadStatus } from "libs/Status";
import {
    ASSESSMENT_IMG_SIZES,
    ASSESSMENT_IMG_TEXT_POSITIONS,
    DEFAULT_ASSESSMENT_IMG_SIZE,
    DEFAULT_ASSESSMENT_IMG_TEXT_POSITION,
    TAssessmentImgSize,
    TAssessmentImgTextPosition,
    TTeacherAssessmentImg,
} from "models/Activity/Items/TAssessmentItems";
import { ImageState } from "models/Img";

import { TeacherAssessmentTypeProps } from "./TeacherAssessmentTypeBase";

const imageSizeLabels: Record<TAssessmentImgSize, string> = {
    small: "Маленький",
    medium: "Средний",
    large: "Большой",
};

const textPositionLabels: Record<TAssessmentImgTextPosition, string> = {
    top: "Сверху",
    bottom: "Снизу",
    left: "Слева",
    right: "Справа",
};

const TeacherAssessmentImg = ({ data, taskUUID, onChangeTask }: TeacherAssessmentTypeProps<TTeacherAssessmentImg>) => {
    const [img, setImg] = useState<ImageState>(
        data.url === "" ? { loadStatus: LoadStatus.NONE } : { loadStatus: LoadStatus.DONE, url: data.url },
    );

    const normalizedData: TTeacherAssessmentImg = {
        ...data,
        imageSize: data.imageSize ?? DEFAULT_ASSESSMENT_IMG_SIZE,
        textPosition: data.textPosition ?? DEFAULT_ASSESSMENT_IMG_TEXT_POSITION,
    };

    useEffect(() => {
        setImg(data.url === "" ? { loadStatus: LoadStatus.NONE } : { loadStatus: LoadStatus.DONE, url: data.url });
    }, [data.url]);

    const setImgHandler = (imgState: ImageState) => {
        if (imgState.loadStatus === LoadStatus.DONE) {
            onChangeTask({ ...normalizedData, url: imgState.url });
        } else {
            setImg(imgState);
        }
    };

    const clearImage = () => {
        setImg({ loadStatus: LoadStatus.NONE });
        onChangeTask({ ...normalizedData, url: "" });
    };

    return (
        <>
            <FloatingLabelTextareaAutosize
                htmlId={`description_${taskUUID}`}
                placeholder="Описание"
                value={normalizedData.description || ""}
                onChangeHandler={(newValue: string) => onChangeTask({ ...normalizedData, description: newValue })}
                rows={5}
                noErrorField={true}
                autoFocus={false}
            />
            <div className="assessment-task-image-editor mt-3">
                <div className="assessment-task-image-editor__compact-row">
                    <div className="assessment-task-image-editor__upload-col">
                        <div className="assessment-task-image-editor__section-label">Картинка</div>
                        <InputImage
                            htmlId={taskUUID}
                            placeholder="Картинка"
                            value={img}
                            onChangeHandler={setImgHandler}
                            isCompact={true}
                            onClear={clearImage}
                        />
                    </div>
                    <div className="assessment-task-image-editor__settings-col">
                        <div className="assessment-img-editor__toggle-row assessment-img-editor__toggle-row--compact">
                            <span className="assessment-img-editor__toggle-label">Размер</span>
                            <div
                                className="assessment-img-editor__toggle-group"
                                role="group"
                                aria-label="Размер картинки"
                            >
                                {ASSESSMENT_IMG_SIZES.map((size) => (
                                    <button
                                        key={size}
                                        type="button"
                                        className={`assessment-img-editor__toggle-btn assessment-img-editor__toggle-btn--compact ${
                                            normalizedData.imageSize === size
                                                ? "assessment-img-editor__toggle-btn--active"
                                                : ""
                                        }`}
                                        onClick={() => onChangeTask({ ...normalizedData, imageSize: size })}
                                    >
                                        {imageSizeLabels[size]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="assessment-img-editor__toggle-row assessment-img-editor__toggle-row--compact">
                            <span className="assessment-img-editor__toggle-label">Текст</span>
                            <div
                                className="assessment-img-editor__toggle-group"
                                role="group"
                                aria-label="Положение текста"
                            >
                                {ASSESSMENT_IMG_TEXT_POSITIONS.map((position) => (
                                    <button
                                        key={position}
                                        type="button"
                                        className={`assessment-img-editor__toggle-btn assessment-img-editor__toggle-btn--compact ${
                                            normalizedData.textPosition === position
                                                ? "assessment-img-editor__toggle-btn--active"
                                                : ""
                                        }`}
                                        onClick={() => onChangeTask({ ...normalizedData, textPosition: position })}
                                    >
                                        {textPositionLabels[position]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {(normalizedData.description || normalizedData.url) && (
                <div className="mt-3">
                    <AssessmentImgContent data={normalizedData} descriptionClassName="md-last-pad-zero" />
                </div>
            )}
        </>
    );
};

export default TeacherAssessmentImg;
