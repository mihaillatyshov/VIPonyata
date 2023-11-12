export interface IActivityTry {
    id: number;
    try_number: number;
    start_datetime: string;
    end_datetime: string | null;
}

export interface IActivityDoneTry {
    id: number;
    try_number: number;
    start_datetime: string;
    end_datetime: string;
    mistakes_count: number;
    is_checked: boolean;
}
