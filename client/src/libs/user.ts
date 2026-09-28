import { TAuthorizedUser, UserDataType, userKeys, userQueries } from "api/user";
import { TUserData } from "models/TUser";

import { useQuery } from "@tanstack/react-query";

import { queryClient } from "./queryClient";

export const isTeacher = (userData: TUserData) => {
    return userData.level === 1;
};
export const isStudent = (userData: TUserData) => userData.level !== 1;

/** Текущий пользователь; `undefined`, пока сессия не загружена (страницы рендерятся только после загрузки). */
export const useSessionUser = (): UserDataType | undefined => {
    return useQuery(userQueries.session()).data;
};

export const useUserIsTeacher = () => {
    const user = useSessionUser();
    return user !== undefined && user.isAuth && isTeacher(user.userData);
};

export const useUserIsStudent = () => {
    const user = useSessionUser();
    return user !== undefined && user.isAuth && isStudent(user.userData);
};

export const useGetAuthorizedUserSafe = (): TAuthorizedUser => {
    return useSessionUser() as TAuthorizedUser;
};

export const setSessionUser = (user: UserDataType) => {
    queryClient.setQueryData(userKeys.session(), user);
};

/** Выход или истёкшая сессия: данные прежнего пользователя из кеша удаляются, роутинг покажет страницу входа. */
export const resetSession = () => {
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== userKeys.all[0] });
    setSessionUser({ isAuth: false });
};
