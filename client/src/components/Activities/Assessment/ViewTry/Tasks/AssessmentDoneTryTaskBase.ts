import { TAssessmentCheckedItemBase, TAssessmentItemBase } from "models/Activity/Items/TAssessmentItems";

export interface AssessmentDoneTryTaskBaseProps<T extends TAssessmentItemBase, K extends TAssessmentCheckedItemBase> {
    data: T;
    checks: K;
    taskId: number;
}
