import { AjaxGet, isProcessableError } from "libs/ServerAPI";
import { LoadStatus } from "libs/Status";
import { TShareUsers } from "models/TUser";

export type GetShareUsersDataType = LoadStatus.DataDoneOrNotDone<{ data: TShareUsers }>;

interface GetShareUsersProps {
    id: number;
    type: "courses" | "lessons";
    setUsers: (user: GetShareUsersDataType) => void;
    setError: (error: string) => void;
}

interface GetShareUsersError {
    message: string;
}

export const requestGetShareUsers = ({ type, id, setUsers, setError }: GetShareUsersProps) => {
    setUsers({ loadStatus: LoadStatus.LOADING });
    AjaxGet<TShareUsers>({ url: `/api/${type}/${id}/users` })
        .then((json) => {
            setUsers({ loadStatus: LoadStatus.DONE, data: json });
        })
        .catch((error) => {
            setError(isProcessableError<GetShareUsersError>(error) ? error.json.message : "Ошибка сервера");
            setUsers({ loadStatus: LoadStatus.ERROR });
        });
};
