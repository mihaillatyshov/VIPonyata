import {
    DEFAULT_ASSESSMENT_TASK_IMAGE_POSITION,
    DEFAULT_ASSESSMENT_TASK_IMAGE_SIZE,
    TAssessmentTaskImageAttachment,
} from "models/Activity/Items/TAssessmentItems";

export const normalizeAssessmentTaskImageAttachment = <T extends TAssessmentTaskImageAttachment>(data: T): T => {
    return {
        ...data,
        imageSize: data.imageSize ?? DEFAULT_ASSESSMENT_TASK_IMAGE_SIZE,
        imagePosition: data.imagePosition ?? DEFAULT_ASSESSMENT_TASK_IMAGE_POSITION,
    };
};
