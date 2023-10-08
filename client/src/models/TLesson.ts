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

export type TLessonResponse = {
    lesson: TLesson;
    items: {
        drilling: TDrilling;
        hieroglyph: THieroglyph;
        assessment: TAssessment;
    };
};
