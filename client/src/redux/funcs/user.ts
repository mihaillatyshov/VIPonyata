import { useAppSelector } from "redux/hooks";
import { selectUser } from "redux/slices/userSlice";

export const useUserIsTeacher = () => {
    const user = useAppSelector(selectUser);
    if (user.isAuth && user.userData !== undefined) {
        return user.userData.level === 1;
    }
};
