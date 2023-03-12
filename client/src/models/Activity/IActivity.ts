export interface IActivity<TryType> {
    id: number;
    description: string | null;
    time_limit: string | null;
    lesson_id: number;
    deadline: string | null;
    tries: TryType[];
    try: TryType;
}
