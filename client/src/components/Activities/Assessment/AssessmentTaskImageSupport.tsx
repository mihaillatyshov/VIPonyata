import { useEffect, useLayoutEffect, useRef, useState } from "react";

import InputImage from "components/Form/InputImage";
import { LoadStatus } from "libs/Status";
import {
    ASSESSMENT_TASK_IMAGE_POSITIONS,
    ASSESSMENT_TASK_IMAGE_SIZES,
    DEFAULT_ASSESSMENT_TASK_IMAGE_POSITION,
    DEFAULT_ASSESSMENT_TASK_IMAGE_SIZE,
    TAssessmentTaskImageAttachment,
    TAssessmentTaskImagePosition,
    TAssessmentTaskImageSize,
} from "models/Activity/Items/TAssessmentItems";
import { ImageState } from "models/Img";

import { normalizeAssessmentTaskImageAttachment } from "./AssessmentTaskImageUtils";

const imageSizeLabels: Record<TAssessmentTaskImageSize, string> = {
    tiny: "Мелкий",
    small: "Маленький",
    medium: "Средний",
};

const imagePositionLabels: Record<TAssessmentTaskImagePosition, string> = {
    left: "Слева",
    right: "Справа",
    top: "Сверху",
    bottom: "Снизу",
};

interface AssessmentTaskImageLayoutProps {
    image?: string | null;
    imageSize?: TAssessmentTaskImageSize | null;
    imagePosition?: TAssessmentTaskImagePosition | null;
    children: React.ReactNode;
    className?: string;
}

interface AssessmentTaskImageEditorControlsProps<T extends TAssessmentTaskImageAttachment> {
    data: T;
    htmlId: string;
    onChange: (data: T) => void;
}

export const AssessmentTaskImageLayout = ({
    image,
    imageSize,
    imagePosition,
    children,
    className,
}: AssessmentTaskImageLayoutProps) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const imageWrapRef = useRef<HTMLDivElement>(null);
    const [imageOffsetTop, setImageOffsetTop] = useState(0);

    const normalizedSize = imageSize ?? DEFAULT_ASSESSMENT_TASK_IMAGE_SIZE;
    const normalizedPosition = imagePosition ?? DEFAULT_ASSESSMENT_TASK_IMAGE_POSITION;
    const isSidePosition = normalizedPosition === "left" || normalizedPosition === "right";

    useLayoutEffect(() => {
        if (!image || !isSidePosition || !contentRef.current || !imageWrapRef.current) {
            setImageOffsetTop(0);
            return;
        }

        const syncImageOffset = () => {
            if (!contentRef.current || !imageWrapRef.current) {
                return;
            }

            const contentHeight = contentRef.current.getBoundingClientRect().height;
            const imageHeight = imageWrapRef.current.getBoundingClientRect().height;
            setImageOffsetTop(Math.max((contentHeight - imageHeight) / 2, 0));
        };

        syncImageOffset();

        window.addEventListener("resize", syncImageOffset);
        return () => window.removeEventListener("resize", syncImageOffset);
    }, [image, isSidePosition, normalizedSize]);

    const handleImageLoad = () => {
        if (!isSidePosition || !contentRef.current || !imageWrapRef.current) {
            setImageOffsetTop(0);
            return;
        }

        const contentHeight = contentRef.current.getBoundingClientRect().height;
        const imageHeight = imageWrapRef.current.getBoundingClientRect().height;
        setImageOffsetTop(Math.max((contentHeight - imageHeight) / 2, 0));
    };

    if (!image) {
        return <>{children}</>;
    }

    const rootClassName = [
        "assessment-task-image-content",
        `assessment-task-image-content--${normalizedPosition}`,
        `assessment-task-image-content--${normalizedSize}`,
        className,
    ]
        .filter(Boolean)
        .join(" ");

    const imageNode = (
        <div
            ref={imageWrapRef}
            className="assessment-task-image-content__image-wrap"
            style={
                isSidePosition
                    ? ({ "--assessment-task-image-fixed-offset": `${imageOffsetTop}px` } as React.CSSProperties)
                    : undefined
            }
        >
            <img
                alt="Task illustration"
                className="assessment-task-image-content__image"
                src={image}
                onLoad={handleImageLoad}
            />
        </div>
    );

    const contentNode = (
        <div ref={contentRef} className="assessment-task-image-content__body">
            {children}
        </div>
    );

    if (normalizedPosition === "left" || normalizedPosition === "top") {
        return (
            <div className={rootClassName}>
                {imageNode}
                {contentNode}
            </div>
        );
    }

    return (
        <div className={rootClassName}>
            {contentNode}
            {imageNode}
        </div>
    );
};

export const AssessmentTaskImageEditorControls = <T extends TAssessmentTaskImageAttachment>({
    data,
    htmlId,
    onChange,
}: AssessmentTaskImageEditorControlsProps<T>) => {
    const normalizedData = normalizeAssessmentTaskImageAttachment(data);
    const [img, setImg] = useState<ImageState>(
        normalizedData.image
            ? { loadStatus: LoadStatus.DONE, url: normalizedData.image }
            : { loadStatus: LoadStatus.NONE },
    );

    useEffect(() => {
        setImg(
            normalizedData.image
                ? { loadStatus: LoadStatus.DONE, url: normalizedData.image }
                : { loadStatus: LoadStatus.NONE },
        );
    }, [normalizedData.image]);

    const updateImage = (imgState: ImageState) => {
        if (imgState.loadStatus === LoadStatus.DONE) {
            onChange({ ...normalizedData, image: imgState.url });
            return;
        }

        setImg(imgState);
    };

    const clearImage = () => {
        setImg({ loadStatus: LoadStatus.NONE });
        onChange({ ...normalizedData, image: undefined });
    };

    return (
        <div className="assessment-task-image-editor mt-3">
            <div className="assessment-task-image-editor__compact-row">
                <div className="assessment-task-image-editor__upload-col">
                    <div className="assessment-task-image-editor__section-label">Картинка</div>
                    <InputImage
                        htmlId={`${htmlId}_attachment`}
                        placeholder="Картинка"
                        value={img}
                        onChangeHandler={updateImage}
                        isCompact={true}
                        onClear={clearImage}
                    />
                </div>
                <div className="assessment-task-image-editor__settings-col">
                    <div className="assessment-img-editor__toggle-row assessment-img-editor__toggle-row--compact">
                        <span className="assessment-img-editor__toggle-label">Размер</span>
                        <div className="assessment-img-editor__toggle-group" role="group" aria-label="Размер картинки">
                            {ASSESSMENT_TASK_IMAGE_SIZES.map((size) => (
                                <button
                                    key={size}
                                    type="button"
                                    className={`assessment-img-editor__toggle-btn assessment-img-editor__toggle-btn--compact ${
                                        normalizedData.imageSize === size
                                            ? "assessment-img-editor__toggle-btn--active"
                                            : ""
                                    }`}
                                    onClick={() => onChange({ ...normalizedData, imageSize: size })}
                                >
                                    {imageSizeLabels[size]}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="assessment-img-editor__toggle-row assessment-img-editor__toggle-row--compact">
                        <span className="assessment-img-editor__toggle-label">Положение</span>
                        <div
                            className="assessment-img-editor__toggle-group"
                            role="group"
                            aria-label="Расположение картинки"
                        >
                            {ASSESSMENT_TASK_IMAGE_POSITIONS.map((position) => (
                                <button
                                    key={position}
                                    type="button"
                                    className={`assessment-img-editor__toggle-btn assessment-img-editor__toggle-btn--compact ${
                                        normalizedData.imagePosition === position
                                            ? "assessment-img-editor__toggle-btn--active"
                                            : ""
                                    }`}
                                    onClick={() => onChange({ ...normalizedData, imagePosition: position })}
                                >
                                    {imagePositionLabels[position]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
