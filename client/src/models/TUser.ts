export interface TUserData {
    id: number;
    name: string;
    nickname: string;
    avatar: string;
    form: string;
    level: number;
}

export interface TShareUsers {
    inside: TUserData[];
    outside: TUserData[];
}
