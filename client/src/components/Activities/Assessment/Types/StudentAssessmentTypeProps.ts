import { TAssessmentItemBase } from "models/Activity/Items/TAssessmentItems";

export type StudentAssessmentTypeProps<T extends TAssessmentItemBase> = {
    data: T;
    taskId: number;
};
