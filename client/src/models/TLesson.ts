export interface TLesson {
    id: number;
    name: string;
    number: number;
    description: string | null;
    course_id: number;
    creation_datetime: string | null;
}
