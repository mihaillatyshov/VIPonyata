import { ILexis } from "./Activity/ILexis";
import { TAssessment } from "./Activity/TAssessment";
import { TAssessmentTry } from "./Activity/Try/TAssessmentTry";
import { TLexisTry } from "./Activity/Try/TLexisTry";
import { TLesson } from "./TLesson";
import { TUserData } from "./TUser";

interface TNotiifcation {
    id: number;
    created_datetime: string;
    message?: string;
}

type TTeacherNotificationActivity = {
    activity_try_id: number;
    lesson: TLesson;
    user: TUserData;
} & (
    | {
          type: "drilling_try" | "hieroglyph_try";
          activity: ILexis;
          activity_try: TLexisTry;
      }
    | {
          type: "assessment_try" | "final_boss_try";
          activity: TAssessment;
          activity_try: TAssessmentTry;
      }
);

export type TTeacherNotificationWithActivity = TNotiifcation & TTeacherNotificationActivity;
export type TTeacherNotification = (TNotiifcation & { type: null }) | TTeacherNotificationWithActivity;

export interface TStudentNotification extends TNotiifcation {}

export type TAnyNotification = TStudentNotification | TTeacherNotification;
