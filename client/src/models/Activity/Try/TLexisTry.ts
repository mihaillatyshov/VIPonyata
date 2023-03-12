import { TLexisDoneTasks } from "../DoneTasks/TLexisDoneTasks";
import { IActivityTry } from "./IActivityTry";

export interface TLexisTry extends IActivityTry {
    done_tasks: TLexisDoneTasks;
    base_id: number;
}
