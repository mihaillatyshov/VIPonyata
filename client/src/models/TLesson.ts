export interface TLesson {
    id: number;
    name: string;
    number: number;
    description: string | null;
    course_id: number;
    creation_datetime: string | null;
}

export interface TLessonCreate {
    name: string;
    number: number;
    description: string | null;
    img: string | null;
}
