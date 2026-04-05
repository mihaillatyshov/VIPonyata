import { TAssessment } from "./Activity/TAssessment";
import { TDrilling } from "./Activity/TDrilling";
import { THieroglyph } from "./Activity/THieroglyph";

export interface TLesson {
    id: number;
    name: string;
    number: number;
    description: string | null;
    img: string | null;
    course_id: number;
    creation_datetime: string | null;
}

export interface TLessonCreate {
    name: string;
    number: number;
    description: string | null;
    img: string | null;
}

export interface TUnfinishedLessonsSummary {
    has_unfinished_lessons: boolean;
    unfinished_lessons_count: number;
    next_unfinished_course_name: string | null;
    next_unfinished_lesson_id: number | null;
    next_unfinished_lesson_name: string | null;
    next_unfinished_activity_type: "drilling" | "hieroglyph" | "assessment" | null;
    next_unfinished_activity_id: number | null;
    next_unfinished_activity_started_at: string | null;
    items: TUnfinishedLessonItem[];
}

export interface TUnfinishedLessonItem {
    course_name: string;
    lesson_id: number;
    lesson_name: string;
    activity_type: "drilling" | "hieroglyph" | "assessment";
    activity_id: number;
    activity_started_at: string;
}

export type TLessonResponse = {
    lesson: TLesson;
    unfinished_lessons?: TUnfinishedLessonsSummary;
    items: {
        drilling: TDrilling;
        hieroglyph: THieroglyph;
        assessment: TAssessment;
        final_boss: TAssessment;
    };
};
