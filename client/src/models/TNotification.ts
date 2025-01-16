import { TAssessment } from "./Activity/TAssessment";
import { TAssessmentTry } from "./Activity/Try/TAssessmentTry";
import { TLexisTry } from "./Activity/Try/TLexisTry";
import { TCourse } from "./TCourse";
import { TLesson } from "./TLesson";
import { TUserData } from "./TUser";

type TNotificationLexisType = Pick<TLexisTry, "id" | "start_datetime" | "end_datetime">;
type TNotificationAssessmentType = Pick<TAssessmentTry, "id" | "start_datetime" | "end_datetime">;

export interface TNotificationBase {
    id: number;
    creation_datetime: string;
    message?: string;
    viewed: boolean;
    deleted: boolean;
}

type TTeacherNotificationActivity = {
    activity_try_id: number;
    lesson: TLesson;
    user: TUserData;
} & (
    | {
          type: "drilling_try" | "hieroglyph_try";
          activity_try: TNotificationLexisType;
      }
    | {
          type: "assessment_try" | "final_boss_try";
          activity_try: TNotificationAssessmentType;
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

export type TStudentNotificationShareAny = TNotificationBase &
    (TStudentNotificationShareLesson | TStudentNotificationShareCourse);

type TStudentNotificationActivityBase = {
    activity_try_id: number;
    lesson: TLesson;
    type: "assessment_try" | "final_boss_try";
    activity: TAssessment;
    activity_try: TNotificationAssessmentType;
};

export type TStudentNotificationActivity = TNotificationBase & TStudentNotificationActivityBase;

export type TTeacherNotificationWithActivity = TNotificationBase & TTeacherNotificationActivity;
export type TTeacherNotification = (TNotificationBase & { type: null }) | TTeacherNotificationWithActivity;

export type TStudentNotificationCustom = TStudentNotificationShareAny | TStudentNotificationActivity;
export type TStudentNotification = (TNotificationBase & { type: null }) | TStudentNotificationCustom;

export type TAnyNotifications = TStudentNotification[] | TTeacherNotification[];
