import { TAssessmentCheckedItems, TTeacherAssessmentItems } from "../Items/TAssessmentItems";
import { IActivityDoneTry, IActivityTry } from "./IActivityTry";

export interface TAssessmentTry extends IActivityTry {
    done_tasks: TTeacherAssessmentItems;
    base_id: number;
}

export interface TAssessmentDoneTry extends IActivityDoneTry {
    done_tasks: TTeacherAssessmentItems;
    base_id: number;
    checked_tasks: TAssessmentCheckedItems;
}
