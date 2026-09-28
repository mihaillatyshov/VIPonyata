import { AjaxGet } from "libs/ServerAPI";
import { TUserData } from "models/TUser";

import { queryOptions } from "@tanstack/react-query";

export interface TAuthorizedUser {
    isAuth: true;
    userData: TUserData;
}

export interface TNotAuthorizedUser {
    isAuth: false;
}

export type UserDataType = TAuthorizedUser | TNotAuthorizedUser;

export const userKeys = {
    all: ["user"] as const,
    session: () => [...userKeys.all, "session"] as const,
};

export const userQueries = {
    /** Текущий пользователь. Загружается один раз при старте, дальше меняется только через `setSessionUser`. */
    session: () =>
        queryOptions({
            queryKey: userKeys.session(),
            queryFn: ({ signal }) => AjaxGet<UserDataType>({ url: "/api/islogin", signal }),
            staleTime: Infinity,
            gcTime: Infinity,
        }),
};
