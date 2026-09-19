import { ReactMarkdownWithHtml } from "components/Common/ReactMarkdownWithHtml";
import {
    DEFAULT_ASSESSMENT_IMG_SIZE,
    DEFAULT_ASSESSMENT_IMG_TEXT_POSITION,
    TAssessmentImg,
    TAssessmentImgSize,
    TAssessmentImgTextPosition,
} from "models/Activity/Items/TAssessmentItems";

interface AssessmentImgContentProps {
    data: Pick<TAssessmentImg, "description" | "url" | "imageSize" | "textPosition">;
    className?: string;
    descriptionClassName?: string;
}

const getImageSize = (imageSize?: TAssessmentImgSize | null): TAssessmentImgSize => {
    return imageSize ?? DEFAULT_ASSESSMENT_IMG_SIZE;
};

const getTextPosition = (textPosition?: TAssessmentImgTextPosition | null): TAssessmentImgTextPosition => {
    return textPosition ?? DEFAULT_ASSESSMENT_IMG_TEXT_POSITION;
};

export const AssessmentImgContent = ({ data, className, descriptionClassName }: AssessmentImgContentProps) => {
    const imageSize = getImageSize(data.imageSize);
    const textPosition = getTextPosition(data.textPosition);
    const rootClassName = [
        "assessment-img-content",
        `assessment-img-content--${textPosition}`,
        `assessment-img-content--${imageSize}`,
        className,
    ]
        .filter(Boolean)
        .join(" ");

    const descriptionNode = data.description ? (
        <div className={["assessment-img-content__text", descriptionClassName].filter(Boolean).join(" ")}>
            <ReactMarkdownWithHtml>{data.description}</ReactMarkdownWithHtml>
        </div>
    ) : null;

    const imageNode = data.url ? (
        <div className="assessment-img-content__image-wrap">
            <img alt="Img" className="assessment-img-content__image" src={data.url} />
        </div>
    ) : null;

    switch (textPosition) {
        case "bottom":
            return (
                <div className={rootClassName}>
                    {imageNode}
                    {descriptionNode}
                </div>
            );
        case "left":
            return (
                <div className={rootClassName}>
                    {descriptionNode}
                    {imageNode}
                </div>
            );
        case "right":
            return (
                <div className={rootClassName}>
                    {imageNode}
                    {descriptionNode}
                </div>
            );
        case "top":
        default:
            return (
                <div className={rootClassName}>
                    {descriptionNode}
                    {imageNode}
                </div>
            );
    }
};
