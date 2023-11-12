export interface IActivity<TryType> {
    id: number;
    description: string | null;
    time_limit: string | null;
    lesson_id: number;
    deadline: string | null;
    tasks: string;
    tries: TryType[];
    try: TryType;
}

export const LexisNameDrilling = "drilling";
export const LexisNameHieroglyph = "hieroglyph";
export type LexisName = typeof LexisNameDrilling | typeof LexisNameHieroglyph;

export const AssessmentName = "assessment";
export const FinalBossName = "final_boss";
export type IAssessmentName = typeof AssessmentName | typeof FinalBossName;

export type ActivityName = LexisName | IAssessmentName;
