export interface TCourse {
    id: number;
    name: string;
    difficulty: string;
    difficulty_color: string | null;
    sort: number;
    description: string | null;
    img: string | null;
    creation_datetime: string | null;
}

export interface TCourseCreate {
    name: string;
    difficulty: string;
    difficulty_color: string | null;
    sort: number;
    description: string | null;
    img: string | null;
}
