import { LoadStatus } from "libs/Status";
import { TUserData } from "models/TUser";
import { useAppSelector } from "redux/hooks";
import { selectUser, TAuthorizedUser } from "redux/slices/userSlice";

export const useUserIsTeacher = () => {
    const user = useAppSelector(selectUser).data;

    if (user.loadStatus !== LoadStatus.DONE) {
        return false;
    }

    return user.isAuth && user.userData.level === 1;
};

export const useGetAuthorizedUserSafe = (): TAuthorizedUser => {
    return useAppSelector(selectUser).data as TAuthorizedUser;
};

export const isTeacher = (userData: TUserData) => {
    return userData.level === 1;
};
export const isStudent = (userData: TUserData) => userData.level !== 1;
