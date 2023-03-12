import { TAssessmentDoneTasks } from "../DoneTasks/TAssessmentDoneTasks";
import { IActivityTry } from "./IActivityTry";

export interface TAssessmentTry extends IActivityTry {
    done_tasks: TAssessmentDoneTasks;
    base_id: number;
}
