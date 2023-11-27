import { ILexis } from "./Activity/ILexis";
import { TAssessment } from "./Activity/TAssessment";
import { TAssessmentTry } from "./Activity/Try/TAssessmentTry";
import { TLexisTry } from "./Activity/Try/TLexisTry";
import { TCourse } from "./TCourse";
import { TLesson } from "./TLesson";
import { TUserData } from "./TUser";

interface TNotiifcation {
    id: number;
    creation_datetime: string;
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

interface TStudentNotificationShareLesson {
    type: "lesson";
    lesson: TLesson;
    lesson_id: number;
}

interface TStudentNotificationShareCourse {
    type: "course";
    course: TCourse;
    course_id: number;
}

export type TStudentNotificationShareAny = TNotiifcation &
    (TStudentNotificationShareLesson | TStudentNotificationShareCourse);

type TStudentNotificationActivityBase = {
    activity_try_id: number;
    lesson: TLesson;
    type: "assessment_try" | "final_boss_try";
    activity: TAssessment;
    activity_try: TAssessmentTry;
};

export type TStudentNotificationActivity = TNotiifcation & TStudentNotificationActivityBase;

export type TTeacherNotificationWithActivity = TNotiifcation & TTeacherNotificationActivity;
export type TTeacherNotification = (TNotiifcation & { type: null }) | TTeacherNotificationWithActivity;

export type TStudentNotificationCustom = TStudentNotificationShareAny | TStudentNotificationActivity;
export type TStudentNotification = (TNotiifcation & { type: null }) | TStudentNotificationCustom;

export type TAnyNotifications = TStudentNotification[] | TTeacherNotification[];
