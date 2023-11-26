import { TAssessmentCheckedItemBase, TAssessmentItemBase } from "models/Activity/Items/TAssessmentItems";

export interface AssessmentDoneTryTaskBaseProps<T extends TAssessmentItemBase, K extends TAssessmentCheckedItemBase> {
    data: T;
    checks: K;
    taskId: number;
}

export interface TeacherAssessmentDoneTryTaskProps<
    T extends TAssessmentItemBase,
    K extends TAssessmentCheckedItemBase,
> {
    data: T;
    checks: K;
    taskId: number;
    changeTask: (taskId: number, checks: K) => void;
}

export type TValidationStr = "wrong" | "good" | undefined | null;
